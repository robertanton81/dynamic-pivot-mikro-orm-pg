import { EntitySchema } from '@mikro-orm/core';
import { IProductSales } from './productSales.entity';
import { IPivotValueFilters } from './types';

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
