import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { pgPool } from '../config/postgres.config';

dotenv.config();

async function run() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node dist/utils/run-sql.js <path-to-sql> [more-sql-files ...]');
    process.exit(1);
  }

  const db = process.env.PGDATABASE || '(PGDATABASE not set)';
  const user = process.env.PGUSER || '(PGUSER not set)';
  console.log(`Database context: db=${db}, user=${user}`);

  try {
    for (const fileArg of args) {
      const sqlPath = path.isAbsolute(fileArg) ? fileArg : path.join(process.cwd(), fileArg);
      console.log(`\n=== Executing SQL: ${sqlPath} ===`);
      const sql = fs.readFileSync(sqlPath, 'utf8');
      const started = Date.now();
      await pgPool.query(sql);
      const ms = Date.now() - started;
      console.log(`✓ Done: ${sqlPath} (${ms} ms)`);
    }
    process.exit(0);
  } catch (e) {
    console.error('Failed while executing SQL files:', e);
    process.exit(1);
  }
}

run();