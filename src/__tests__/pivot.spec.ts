import { MikroORM } from '@mikro-orm/core';
import mikroOrmConfig from '../mikro-orm.config';
import { PostgreSqlMikroORM } from '@mikro-orm/postgresql/PostgreSqlMikroORM';
import { IProductSales, ProductSalesEntity } from '../productSales.entity';
import { getPivotQuery } from '../sqlQueries';
import { PostgreSqlDriver, SqlEntityManager } from '@mikro-orm/postgresql';
import { productAndCategory, testData } from './test.utils';
import { getFieldsObject, normaliseDatabaseFieldName } from '../utils';

describe('dynamic pivot table demo', () => {
  let orm: PostgreSqlMikroORM;
  let em: SqlEntityManager<PostgreSqlDriver>;
  let normalisedSourceTableName: string;
  let normalisedFields: Record<keyof IProductSales, string>;

  beforeAll(async () => {
    orm = await MikroORM.init(mikroOrmConfig);
    const schemaGenerator = orm.getSchemaGenerator();
    await schemaGenerator.refreshDatabase();

    em = orm.em.fork();

    //#region test_data
    const now = new Date();
    const start = new Date();
    start.setFullYear(now.getFullYear() - 2);

    const sales = testData.map((sale) => {
      return em.create<IProductSales>(ProductSalesEntity, sale);
    });
    await em.persistAndFlush(sales);
    //#endregion

    // this depends on your orm settings, but as default, the column and table names in database are snake_case
    // so we need to normalise the field names to match the database settings
    normalisedSourceTableName = normaliseDatabaseFieldName(ProductSalesEntity.name.toString());
    normalisedFields = getFieldsObject(ProductSalesEntity);
  });

  afterAll(async () => {
    await orm.close();
  });

  describe('when aggregating on category id', () => {
    it('should return values for existing customer id and categories', async () => {
      // using category as the aggregated pivot column
      const uniqueColumnHeaders = [...new Set(Object.values(productAndCategory).map((category) => category.toString()))];

      const query = getPivotQuery({
        sourceTable: normalisedSourceTableName,
        valueColumn: normalisedFields.salesAmount,
        transposedColumn: normalisedFields.productCategory,
        transposedColumnValues: uniqueColumnHeaders,
        aggregationMethod: 'SUM',
        selectColumns: [normalisedFields.customerId],
      });

      const pivot = await em.execute(query);

      expect(pivot).toEqual([
        {
          customer_id: 11,
          product_category_1: 2,
          product_category_2: 0,
          product_category_3: 1,
        },
      ]);
    });

    it('should return data with zeroes for non categories', async () => {
      const query = getPivotQuery({
        sourceTable: normalisedSourceTableName,
        valueColumn: normalisedFields.salesAmount,
        transposedColumn: normalisedFields.productCategory,
        transposedColumnValues: ['12', '13'],
        aggregationMethod: 'SUM',
        selectColumns: [normalisedFields.customerId],
      });

      const pivot = await em.execute(query);

      expect(pivot).toEqual([
        {
          customer_id: 11,
          product_category_12: 0,
          product_category_13: 0,
        },
      ]);
    });
  });

  describe('when aggregating on customer id', () => {
    it('should return values for existing category id and customers', async () => {
      const query = getPivotQuery({
        sourceTable: normalisedSourceTableName,
        valueColumn: normalisedFields.salesAmount,
        transposedColumn: normalisedFields.customerId,
        transposedColumnValues: ['11', '12', '13'],
        aggregationMethod: 'SUM',
        selectColumns: [normalisedFields.productCategory],
      });

      const pivot = await em.execute(query);

      expect(pivot).toEqual([
        {
          product_category: 3,
          customer_id_11: 1,
          customer_id_12: 0,
          customer_id_13: 0,
        },
        {
          product_category: 1,
          customer_id_11: 2,
          customer_id_12: 0,
          customer_id_13: 0,
        },
      ]);
    });
  });
});
