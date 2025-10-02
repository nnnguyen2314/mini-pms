import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Prefer single DATABASE_URL; fallback to discrete PG* vars
const connectionString = process.env.DATABASE_URL;

export const pgPool = new Pool(
  connectionString
    ? { connectionString, ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined }
    : {
        host: process.env.PGHOST,
        port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
      }
);

// Ensure all pooled connections use the application schema first
pgPool.on('connect', (client) => {
  // Don't await; pool 'connect' allows sync or async. Fire-and-forget is fine here.
  client.query('set search_path to pms, public').catch(() => {});
});

export async function pgHealthcheck(): Promise<boolean> {
  try {
    const res = await pgPool.query('select 1 as ok');
    return res.rows?.[0]?.ok === 1;
  } catch (e) {
    return false;
  }
}
