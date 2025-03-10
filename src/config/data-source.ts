require('dotenv').config();
require('reflect-metadata');
const { DataSource } = require('typeorm');

const POSTGRES_HOST = process.env.POSTGRES_HOST;
const POSTGRES_PORT = process.env.POSTGRES_PORT;
const POSTGRES_USER = process.env.POSTGRES_USER;
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD;
const POSTGRES_DATABASE = process.env.POSTGRES_DATABASE;

const AppDataSource = new DataSource({
  type: 'postgres',
  host: POSTGRES_HOST,
  port: parseInt(POSTGRES_PORT),
  username: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  database: POSTGRES_DATABASE,
  synchronize: false, // Always false in production
  logging: true,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migration/*.js'],
  migrationsTableName: 'migrations',
  ssl: { rejectUnauthorized: false },
});

module.exports = { AppDataSource };
