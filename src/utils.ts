import { EntitySchema } from '@mikro-orm/core';
import { IProductSales } from './productSales.entity';
import { IPivotValueFilters } from './types';
import { IFilter } from './filters';

export const normaliseDatabaseFieldName = (name: string): string => {
  const normalised = name.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  return normalised.startsWith('_') ? normalised.slice(1) : normalised;
};

export const getFieldsObject = <T>(entitySchema: EntitySchema<T>) => {
  const entityProps = entitySchema.meta.properties;
  const fields = Object.keys(entityProps) as (keyof typeof entityProps)[];

  return fields.reduce(
    (acc, name) => ({
      ...acc,
      [name]: normaliseDatabaseFieldName(name),
    }),
    {} as Record<keyof IProductSales, string>,
  );
};

export interface ISort {
  orderByField: string;
  sort: 'ASC' | 'DESC';
}

const getSqlWhereFilters = <T extends string>(filters: IFilter<T>[]) => {
  const sqlFilters = filters.map((filter) => {
    const { fieldName } = filter;
  });
  // const phraseFilterString = `LOWER(phrase) LIKE '%${filters}%'`;
  // const nameFilterString =
  //   catalog === 'kd'
  //     ? `LOWER((catalog ->> 0) ::json ->> 'jmeno_dokladu') LIKE '%${filterValue?.toLowerCase()}%'`
  //     : `CONCAT(LOWER((catalog ->> 0) ::json ->> 'jmeno'),' ',LOWER((catalog ->> 0) ::json ->> 'prijmeni')) LIKE '%${filterValue}%'`;
  // const labelFilterString = `label = '${labelFilter?.toLowerCase()}'`;
  // const withoutTerminatedFilterString = `(catalog ->> 0) ::json ->> 'ukonceno' = 'false'`;
  //
  // const filterStrings = {
  //   ...getViewFilters(filterField, phraseFilterString, 'phrase'),
  //   ...getViewFilters(filterValue, nameFilterString, 'name'),
  //   ...getViewFilters(withoutTerminatedFilter, withoutTerminatedFilterString, 'withoutTerminated'),
  //   ...(labelFilter ? getViewFilters(labelFilter, labelFilterString, 'label') : {}),
  // };
  //
  // if (!isEmptyOptional([filterField, filterValue, labelFilter, withoutTerminatedFilter])) return `WHERE ${Object.values(filterStrings).join(' AND ')}`;

  return '';
};
