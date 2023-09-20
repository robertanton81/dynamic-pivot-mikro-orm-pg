import { MikroORM } from '@mikro-orm/core';
import mikroOrmConfig from '../mikro-orm.config';
import { PostgreSqlMikroORM } from '@mikro-orm/postgresql/PostgreSqlMikroORM';
import { IProductSales, ProductSalesEntity } from '../productSales.entity';
import { getPivotQuery } from '../sqlQueries';
import { PostgreSqlDriver, SqlEntityManager } from '@mikro-orm/postgresql';
import { productAndCategory, testData } from './test.utils';
import { EqualFilter, getFieldsObject, IEqualFilter, IFilter, normaliseDatabaseFieldName } from '../utils';

describe('correctly type filters', () => {
  it('should return correct type for not null filter', () => {
    const equalFilter = new EqualFilter<IProductSales>({ fieldName: 'salesAmount', value: 1 });
    const isEqualFilter = equalFilter instanceof EqualFilter;
    const isEqualFilterType = (filter: IFilter<any>): filter is IEqualFilter<IProductSales> => filter instanceof EqualFilter;
    expect(isEqualFilterType(equalFilter)).toEqual(true);
  });
});
