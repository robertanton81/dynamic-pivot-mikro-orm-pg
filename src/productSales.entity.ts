import { DateTimeType, EntitySchema } from '@mikro-orm/core';

export interface IProductSales {
  id?: number;
  salesDate: Date;
  salesAmount: number;
  productId: number;
  productCategory: number;
  customerId: number;
}

export const ProductSalesEntity = new EntitySchema<IProductSales>({
  name: 'ProductSales',
  properties: {
    id: { type: Number, primary: true },
    salesDate: { type: DateTimeType, nullable: false },
    salesAmount: { type: Number, nullable: false },
    productId: { type: Number, nullable: false },
    productCategory: { type: Number, nullable: false },
    customerId: { type: Number, nullable: false },
  },
});
