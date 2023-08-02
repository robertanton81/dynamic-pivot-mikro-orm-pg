import { defineConfig, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { LoadStrategy, Options } from '@mikro-orm/core';
import { ProductSalesEntity } from './productSales.entity';

const options: Options<PostgreSqlDriver> = {
  tsNode: true,
  user: 'postgres',
  password: 'postgres',
  dbName: 'pivot_demo',
  host: 'localhost',
  port: 5437,
  entities: [ProductSalesEntity],
  entitiesTs: [ProductSalesEntity],
  forceUndefined: true,
  debug: false,
  loadStrategy: LoadStrategy.JOINED,
};
export default defineConfig(options);
