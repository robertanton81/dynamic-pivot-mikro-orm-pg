import { EntitySchema, MikroORM } from '@mikro-orm/core';
import mikroOrmConfig from '../mikro-orm.config';
import { PostgreSqlMikroORM } from '@mikro-orm/postgresql/PostgreSqlMikroORM';

import { faker } from '@faker-js/faker';
import { IProductSales, ProductSalesEntity } from '../productSales.entity';
import { getPivotQuery } from '../sqlQueries';
import { PostgreSqlDriver, SqlEntityManager } from '@mikro-orm/postgresql';

const testData: IProductSales[] = [
  {
    salesDate: new Date('2021-08-26 21:11:07 +00:00'),
    salesAmount: 1,
    productId: 4,
    productCategory: 1,
    customerId: 11,
  },
  {
    salesDate: new Date('2021-08-27 04:18:07 +00:00'),
    salesAmount: 1,
    productId: 1,
    productCategory: 1,
    customerId: 11,
  },
  {
    salesDate: new Date('2021-08-28 11:06:07 +00:00'),
    salesAmount: 1,
    productId: 6,
    productCategory: 3,
    customerId: 11,
  },
];

const productAndCategory: Record<number, number> = {
  1: 1,
  2: 1,
  3: 1,
  4: 2,
  5: 3,
  6: 3,
};

const getNextDate = (start: Date) => new Date(start.getTime() + faker.number.int({ min: 20, max: 60 * 12 }) * 60 * 1000);

const getSalesDates = (salesDate: Date, salesDates: any[] = []): Date[] =>
  salesDate > new Date() ? salesDates : getSalesDates(getNextDate(salesDate), [...salesDates, salesDate]);

const getSalesAmount = () => faker.number.int({ min: 1, max: 1000 });

const normaliseDatabaseFieldName = (name: string): string => {
  const normalised = name.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  return normalised.startsWith('_') ? normalised.slice(1) : normalised;
};

const getFieldsObject = <T>(entitySchema: EntitySchema<T>) => {
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

const getAdHocSalesData = (start: Date, em: SqlEntityManager<PostgreSqlDriver>) => {
  const dates = getSalesDates(start);

  const sales = dates.map((date) => {
    const productId: number = faker.number.int({ min: 1, max: 6 });
    const productCategory = productAndCategory[productId];

    const salesData: IProductSales = {
      salesDate: date,
      productId,
      productCategory,
      salesAmount: getSalesAmount(),
      customerId: faker.number.int({ min: 10, max: 20 }),
    };

    return em.create<IProductSales>(ProductSalesEntity, salesData);
  });
};

describe('dynamic pivot table demo', () => {
  let orm: PostgreSqlMikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init(mikroOrmConfig);
    const schemaGenerator = orm.getSchemaGenerator();
    await schemaGenerator.refreshDatabase();
  });

  afterAll(async () => {
    await orm.close();
  });

  it('should work', async () => {
    //#region test_data
    const em = orm.em.fork();
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
    const normalisedSourceTableName = normaliseDatabaseFieldName(ProductSalesEntity.name.toString());
    const normalisedFields = getFieldsObject(ProductSalesEntity);

    // using catagory as the aggreated pivot column
    const uniqueColumnHeaders = [...new Set(Object.values(productAndCategory).map((catagory) => catagory.toString()))];

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
});
