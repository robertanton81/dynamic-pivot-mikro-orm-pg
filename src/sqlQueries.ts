interface IGetDynamicPivotArgs {
  columnHeaders: (string | number)[];
  aggregatedColumnName: string;
}

export interface IPivotValueFilters {
  fromDate: Date;
  toDate: Date;
  offset: number;
  take: number;
}

/**
 * constructs a dynamic pivoting phase of the query
 */
const getDynamicPivotQueryPart = ({ columnHeaders, aggregatedColumnName }: IGetDynamicPivotArgs) =>
  columnHeaders.map((columnHeader) => `coalesce((json_aggregation ->> '${columnHeader}')::int, 0) as "${aggregatedColumnName}_${columnHeader}"`);

const arrayToColumnName = (columnNames: string[]) => `${columnNames.map((columnName) => `"${columnName}"`).join(', ')}`;

interface IGetPivotArgs {
  transposedColumn: string;
  transposedColumnValues: string[];
  selectColumns: string[];
  sourceTable: string;
  aggregationMethod: 'SUM' | 'AVG';
  valueColumn: string;
}

export const getPivotQuery = ({ transposedColumn, selectColumns, sourceTable, aggregationMethod, valueColumn, transposedColumnValues }: IGetPivotArgs) => {
  return `
        WITH column_headers
                 AS (SELECT unnest(array [${transposedColumnValues}]) "pivot_columns"),
             aggregation
                 AS (SELECT ch.pivot_columns,
                            ${arrayToColumnName(selectColumns)},
                            COALESCE(${aggregationMethod}(${valueColumn}), 0) "${valueColumn}"
                     FROM column_headers ch
                              LEFT JOIN ${sourceTable} s
                                        ON ch.pivot_columns = s.${transposedColumn}
                     WHERE ${selectColumns.map((selectColumn) => `s.${selectColumn} IS NOT NULL`).join(' AND ')}
                     GROUP BY ch.pivot_columns,
                              ${arrayToColumnName(selectColumns)}),
             pre_pivot AS (SELECT ${arrayToColumnName(selectColumns)},
                                  json_object_agg(pivot_columns, ${valueColumn}) AS json_aggregation
                           FROM aggregation
                           GROUP BY ${arrayToColumnName(selectColumns)}),
             pivot AS (SELECT ${arrayToColumnName(selectColumns)},
                              ${getDynamicPivotQueryPart({
                                columnHeaders: transposedColumnValues,
                                aggregatedColumnName: transposedColumn,
                              })}
                       FROM pre_pivot)
        SELECT *
        FROM pivot;
    `;
};

export const sanitizeFilters = (valueFilters: IPivotValueFilters) => {
  const sqlInjectionMatcher = `^(?!.*\\-\\-)(?!.*\\/\\*)(?!.*\\*\\/)(?!.*;)(?!.*CREATE)(?!.*DROP)(?!.*ALTER)(?!.*FROM)(?!.*DATABASE)(?!.*TABLE)(?!.*SELECT)(?!.*UPDATE)(?!.*=)(?!.*TRUE)(?!.*DELETE).*$`;

  return Object.values(valueFilters)
    .map((filterValue) => String(filterValue).toUpperCase())
    .map((value) => {
      const sqlIsSafe = value.match(sqlInjectionMatcher);
      if (!sqlIsSafe) throw new Error('Invalid SQL query arguments');

      return sqlIsSafe;
    });
};
