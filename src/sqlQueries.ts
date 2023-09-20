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

export class ColumnHeaders {
  private readonly _columnHeaders: string[];
  constructor(columnHeaders: string[]) {
    this._columnHeaders = columnHeaders;
  }

  get pivotColumns() {
    return `SELECT unnest(array [${this._columnHeaders}]) "pivot_columns"`;
  }
}

export class CrossData {}

export class PivotBuilder {
  private readonly _pivotColumnHeaders: string[];
  private readonly _selectColumns: string[];
  private readonly _sourceTable: string;
  private readonly _valueColumn: string;
  private readonly _transposedColumn: string;

  private _headersCteAlias: string = '';
  private _crossDataCteAlias: string = '';
  private _aggregationCteAlias: string = '';

  private _columnHeadersCte = '';
  private _crossDataCte = '';
  private _aggregationCte = '';

  constructor({ valueColumn, selectColumns, sourceTable, transposedColumn, transposedColumnValues }: IGetPivotArgs) {
    this._pivotColumnHeaders = transposedColumnValues;
    this._selectColumns = selectColumns;
    this._sourceTable = sourceTable;
    this._valueColumn = valueColumn;
    this._transposedColumn = transposedColumn;
  }

  private _arrayToSelectStatement(tableAlias: string) {
    return `${this._selectColumns.map((columnName) => `"${tableAlias}"."${columnName}"`).join(', ')}`;
  }

  // this is the mandatory first step
  buildColumnHeadersSql() {
    this._headersCteAlias = 'column_headers';
    this._columnHeadersCte = `SELECT unnest(array [${this._pivotColumnHeaders}]) "pivot_columns"`;
  }

  // mandatory second step
  buildCrossDataSql() {
    this._crossDataCteAlias = 'cross_data';
    this._crossDataCte = `SELECT DISTINCT ${this._arrayToSelectStatement('s')},
                                     ch."pivot_columns"
                     FROM ${this._headersCteAlias} ch,
                          ${this._sourceTable} s`;
  }

  // mandatory third step
  buildAggregationSql(aggregationMethod: 'SUM' | 'AVG') {
    this._aggregationCteAlias = 'aggregation';
    this._aggregationCte = `SELECT cd.pivot_columns,
                            ${this._arrayToSelectStatement('cd')},
                            COALESCE(${aggregationMethod}(${this._valueColumn}), 0) "${this._valueColumn}"
                     FROM ${this._crossDataCteAlias} cd
                              LEFT JOIN ${this._sourceTable} s
                                        ON cd.pivot_columns = s.${this._transposedColumn} AND ${this._selectColumns
                                          .map((selectColumn) => `s.${selectColumn} = cd.${selectColumn}`)
                                          .join(' AND ')}
                     GROUP BY cd.pivot_columns,
                              ${arrayToColumnName(this._selectColumns, 'cd')}`;
  }
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
