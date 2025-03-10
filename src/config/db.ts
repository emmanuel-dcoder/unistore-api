import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import {
  POSTGRES_DATABASE,
  POSTGRES_HOST,
  POSTGRES_PASSWORD,
  POSTGRES_PORT,
  POSTGRES_USER,
} from '.';
import { SeederOptions } from 'typeorm-extension';
import { DataSourceOptions } from 'typeorm';

require('dotenv').config();

class DbConfig {
  public getTypeOrmConfig(): DataSourceOptions {
    return {
      type: 'postgres',
      host: POSTGRES_HOST,
      port: parseInt(POSTGRES_PORT),
      username: POSTGRES_USER,
      password: POSTGRES_PASSWORD,
      database: POSTGRES_DATABASE,
      synchronize: false,
      entities: ['dist/**/*.entity.js'],
      migrationsTableName: 'migration',
      migrations: ['dist/migration/*.js'],
      migrationsRun: true, // Run migrations automatically on startup
      ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
    };
  }
}

const dbconfig = new DbConfig();

export { dbconfig };
