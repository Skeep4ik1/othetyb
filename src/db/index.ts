import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.ts';

const { Pool } = pg;

declare global {
  var _postgresPool: pg.Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    if (connectionString) {
      global._postgresPool = new Pool({
        connectionString,
        ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
        max: 10,
        connectionTimeoutMillis: 15000,
      });
    } else {
      global._postgresPool = new Pool({
        host: process.env.SQL_HOST || process.env.POSTGRES_HOST || 'localhost',
        port: Number(process.env.SQL_PORT || process.env.POSTGRES_PORT || 5432),
        user: process.env.SQL_USER || process.env.POSTGRES_USER || 'postgres',
        password: process.env.SQL_PASSWORD || process.env.POSTGRES_PASSWORD || '',
        database: process.env.SQL_DB_NAME || process.env.POSTGRES_DB || 'postgres',
        ssl: process.env.SQL_SSL === 'true' ? { rejectUnauthorized: false } : false,
        max: 10,
        connectionTimeoutMillis: 15000,
      });
    }

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });
