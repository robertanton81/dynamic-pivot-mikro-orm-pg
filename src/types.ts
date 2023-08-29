export interface IGetDynamicPivotArgs {
  columnHeaders: (string | number)[];
  aggregatedColumnName: string;
}

export interface IPivotValueFilters {
  fromDate: Date;
  toDate: Date;
  offset: number;
  take: number;
}
