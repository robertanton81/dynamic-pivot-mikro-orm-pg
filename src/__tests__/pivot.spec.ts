import { MikroORM } from '@mikro-orm/core';
import mikroOrmConfig from '../mikro-orm.config';
import { PostgreSqlMikroORM } from '@mikro-orm/postgresql/PostgreSqlMikroORM';

import { faker } from '@faker-js/faker';
import { IProductSales, ProductSalesEntity } from '../productSales.entity';
import { setPivotColumns } from '../sqlQueries';

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

    const dates = getSalesDates(start);

    const sales = dates.map((date) => {
      const productId: number = faker.number.int({ min: 1, max: 6 });
      const productCategory = productAndCategory[productId];

      const saleData: IProductSales = {
        salesDate: date,
        productId,
        productCategory,
        salesAmount: getSalesAmount(),
        customerId: faker.number.int({ min: 10, max: 20 }),
      };

      return em.create<IProductSales>(ProductSalesEntity, saleData);
    });
    await em.persistAndFlush(sales);
    //#endregion

    const entityProps = ProductSalesEntity.meta.properties;
    // this depends on your orm settings, but as default, the column and table names in database are snake_case
    // so we need to normalise the field names to match the database settings
    const normalisedSourceTableName = normaliseDatabaseFieldName(ProductSalesEntity.name.toString());

    const fields = Object.keys(entityProps) as (keyof typeof entityProps)[];
    const normalisedFields: Record<keyof IProductSales, string> = fields.reduce(
      (acc, name) => ({
        ...acc,
        [name]: normaliseDatabaseFieldName(name),
      }),
      {} as Record<keyof IProductSales, string>,
    );

    const query = setPivotColumns({
      sourceTable: normalisedSourceTableName,
      valueColumn: normalisedFields.salesAmount,
      transposedColumn: normalisedFields.customerId,
      aggregationMethod: 'SUM',
      selectColumns: [normalisedFields.productCategory],
    });

    expect(true).toBeTruthy();
  });
});
