import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { pgPool } from '../config/postgres.config';
import { hashPassword } from '../repositories/user.auth.repository.postgres';

dotenv.config();

async function execSqlFile(relPath: string) {
  // Resolve SQL file relative to this utils script to avoid CWD issues
  const full = path.resolve(__dirname, '../../', relPath);
  const sql = fs.readFileSync(full, 'utf8');
  const started = Date.now();
  await pgPool.query(sql);
  const ms = Date.now() - started;
  console.log(`✓ Executed ${relPath} in ${ms} ms`);
}

const DEFAULT_PASSWORD = 'PmsU3ser';
const SEEDED_USER_EMAILS = [
  'owner@example.com',
  'nhatnguyen.nguyen23@gmail.com',
  'member@example.com',
  'guest@example.com',
];

async function hashSeededUserPasswords() {
  const client = await pgPool.connect();
  try {
    const hash = hashPassword(DEFAULT_PASSWORD);
    let updated = 0;
    for (const email of SEEDED_USER_EMAILS) {
      const { rowCount } = await client.query(
        `update mini_pms.users set password_hash = $1, updated_at = now() where lower(email) = lower($2)`,
        [hash, email]
      );
      if (rowCount && rowCount > 0) updated += rowCount;
    }
    if (updated > 0) {
      console.log(`✓ Hashed password set for ${updated} seeded user(s).`);
    } else {
      console.log('No seeded users found to update (did you already hash them or skip seeding?).');
    }
  } finally {
    client.release();
  }
}

async function main() {
  const db = process.env.PGDATABASE || '(PGDATABASE not set)';
  const user = process.env.PGUSER || '(PGUSER not set)';
  console.log(`Database context: db=${db}, user=${user}`);
  try {
    await execSqlFile('db/mini_pms.sql');
    await execSqlFile('db/seed.sql');
    // After seeding, ensure passwords are hashed (pbkdf2) for the seeded users
    await hashSeededUserPasswords();
    console.log('All done.');
    process.exit(0);
  } catch (e) {
    console.error('Init data failed:', e);
    process.exit(1);
  }
}

main();
