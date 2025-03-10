import { DataSource } from 'typeorm';
import {
  POSTGRES_DATABASE,
  POSTGRES_HOST,
  POSTGRES_PASSWORD,
  POSTGRES_PORT,
  POSTGRES_USER,
} from './config/keys';

require('dotenv').config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: POSTGRES_HOST,
  port: parseInt(POSTGRES_PORT),
  username: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  database: POSTGRES_DATABASE,
  synchronize: false, // Should be false for migrations
  entities: ['dist/**/*.entity.js'],
  migrationsTableName: 'migration',
  migrations: ['dist/migrations/*.js'],
  migrationsRun: false, // Run manually using CLI
  ssl: false,
});

// Initialize the data source (for CLI commands)
AppDataSource.initialize()
  .then(() => console.log('Data Source has been initialized!'))
  .catch((err) => console.error('Error initializing Data Source:', err));

// Ensure that the data source is initialized before running migrations
AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
  })
  .catch((err) => {
    console.error('Error during Data Source initialization:', err);
  });
