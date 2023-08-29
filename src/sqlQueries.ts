import { IGetDynamicPivotArgs } from './types';

/**
 * constructs a dynamic pivoting phase of the query
 */
const getDynamicPivotQueryPart = ({ columnHeaders, aggregatedColumnName }: IGetDynamicPivotArgs) =>
  columnHeaders.map((columnHeader) => `coalesce((json_aggregation ->> '${columnHeader}')::int, 0) as "${aggregatedColumnName}_${columnHeader}"`);

const arrayToColumnName = (columnNames: string[], tableAlias: string) => `${columnNames.map((columnName) => `"${tableAlias}"."${columnName}"`).join(', ')}`;

interface IGetPivotArgs {
  transposedColumn: string;
  transposedColumnValues: string[];
  selectColumns: string[];
  sourceTable: string;
  aggregationMethod: 'SUM' | 'AVG';
  valueColumn: string;
}

// TODO: add strong types for column names, matching the entity schema
// TODO: force transposedColumnValues type to be a transposedColumn's values type
// TODO: force transposedColumn not to be in selectColumns
export const getPivotQuery = ({ transposedColumn, selectColumns, sourceTable, aggregationMethod, valueColumn, transposedColumnValues }: IGetPivotArgs) => {
  return `
        WITH column_headers
                 AS (SELECT unnest(array [${transposedColumnValues}]) "pivot_columns"),
             cross_data
                 AS (SELECT DISTINCT ${arrayToColumnName(selectColumns, 's')},
                                     "pivot_columns"
                     FROM column_headers ch,
                          ${sourceTable} s),
             aggregation
                 AS (SELECT cd.pivot_columns,
                            ${arrayToColumnName(selectColumns, 'cd')},
                            COALESCE(${aggregationMethod}(${valueColumn}), 0) "${valueColumn}"
                     FROM cross_data cd
                              LEFT JOIN ${sourceTable} s
                                        ON cd.pivot_columns = s.${transposedColumn} AND ${selectColumns
                                          .map((selectColumn) => `s.${selectColumn} = cd.${selectColumn}`)
                                          .join(' AND ')}
                     GROUP BY cd.pivot_columns,
                              ${arrayToColumnName(selectColumns, 'cd')}),
             pre_pivot AS (SELECT ${arrayToColumnName(selectColumns, 'a')},
                                  json_object_agg(pivot_columns, ${valueColumn}) AS json_aggregation
                           FROM aggregation a
                           GROUP BY ${arrayToColumnName(selectColumns, 'a')}),
             pivot AS (SELECT ${arrayToColumnName(selectColumns, 'pp')},
                              ${getDynamicPivotQueryPart({
                                columnHeaders: transposedColumnValues,
                                aggregatedColumnName: transposedColumn,
                              })}
                       FROM pre_pivot pp)
        SELECT *
        FROM pivot;
    `;
};
