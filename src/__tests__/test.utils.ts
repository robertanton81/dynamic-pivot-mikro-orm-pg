import { IProductSales, ProductSalesEntity } from '../productSales.entity';
import { faker } from '@faker-js/faker';
import { PostgreSqlDriver, SqlEntityManager } from '@mikro-orm/postgresql';

export const testData: IProductSales[] = [
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

export const productAndCategory: Record<number, number> = {
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

export const getAdHocSalesData = (start: Date, em: SqlEntityManager<PostgreSqlDriver>) => {
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
