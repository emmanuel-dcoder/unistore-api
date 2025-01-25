import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import {
  POSTGRES_DATABASE,
  POSTGRES_HOST,
  POSTGRES_PASSWORD,
  POSTGRES_PORT,
  POSTGRES_USER,
} from '.';
import { SeederOptions } from 'typeorm-extension';

require('dotenv').config();

class DbConfig {
  public getTypeOrmConfig(): TypeOrmModuleOptions & SeederOptions {
    return {
      type: 'postgres',
      host: POSTGRES_HOST,
      port: parseInt(POSTGRES_PORT),
      username: POSTGRES_USER,
      password: POSTGRES_PASSWORD,
      database: POSTGRES_DATABASE,
      synchronize: process.env.NODE_ENV === 'development' ? true : false,
      entities: ['dist/**/*.entity.js'],
      migrationsTableName: 'migration',
      migrations: ['dist/migration/*.js'],
      ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
      autoLoadEntities: true,
    };
  }
}

const dbconfig = new DbConfig();

export { dbconfig };
