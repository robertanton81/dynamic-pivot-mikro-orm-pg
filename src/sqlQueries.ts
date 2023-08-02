interface IGetDynamicPivotArgs {
  columnHeaders: (string | number)[];
  transposedColumn: string;
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
const getDynamicPivotQueryPart = ({ columnHeaders, transposedColumn }: IGetDynamicPivotArgs) =>
  columnHeaders.map((columnHeader) => `coalesce((${transposedColumn} ->> '${columnHeader}')::int, 0) as "${transposedColumn}_${columnHeader}"`);

const aggregateValue = (valueColumn: string, aggregationMethod: 'SUM' | 'AVG', partitionColumns: string[]) =>
  `${aggregationMethod}(${valueColumn}) OVER (PARTITION BY ${arrayToString(partitionColumns)})`;

const arrayToString = (columnNames: string[]) => `${columnNames.map((columnName) => `"${columnName}"`).join(', ')}`;

interface IGetPivotArgs {
  transposedColumn: string;
  selectColumns: string[];
  sourceTable: string;
  aggregationMethod: 'SUM' | 'AVG';
  valueColumn: string;
}

export const setPivotColumns = ({ transposedColumn, selectColumns, sourceTable, aggregationMethod, valueColumn }: IGetPivotArgs) => {
  return `
        WITH column_headers AS (SELECT DISTINCT ${transposedColumn}
                                FROM ${sourceTable} s),
             aggregation
                 AS (SELECT ch.${transposedColumn},
                            ${arrayToString(selectColumns)},
                            COALESCE(${aggregationMethod}(${valueColumn}), 0) "${valueColumn}"
                     FROM column_headers ch
                              LEFT JOIN ${sourceTable} s
                                        ON ch.${transposedColumn} = s.${transposedColumn}
                     GROUP BY ch.${transposedColumn},
                              ${arrayToString(selectColumns)})
        SELECT *
        FROM aggregation;
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
