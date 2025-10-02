import dotenv from 'dotenv';
import { pgPool } from '../config/postgres.config';
import { hashPassword } from '../repositories/user.auth.repository.postgres';

dotenv.config();

const DEFAULT_PASSWORD = 'PmsU3ser';

// These emails must match the users inserted in db/seed.sql
const SEEDED_USER_EMAILS = [
  'owner@example.com',
  'nhatnguyen.nguyen23@gmail.com',
  'member@example.com',
  'guest@example.com',
];

async function main() {
  const client = await pgPool.connect();
  try {
    console.log('Seeding default passwords for users:', SEEDED_USER_EMAILS.join(', '));
    const hash = hashPassword(DEFAULT_PASSWORD);
    const results: string[] = [];

    for (const email of SEEDED_USER_EMAILS) {
      const { rowCount } = await client.query(
        `update mini_pms.users set password_hash = $1, updated_at = now() where lower(email) = lower($2)`,
        [hash, email]
      );
      if (rowCount && rowCount > 0) {
        results.push(email);
      }
    }

    if (results.length) {
      console.log(`Updated password for ${results.length} user(s).`);
    } else {
      console.log('No matching users found to update. Did you run db/seed.sql first?');
    }
  } catch (e) {
    console.error('Failed to seed user passwords:', e);
    process.exit(1);
  } finally {
    client.release();
  }
}

main().then(() => process.exit(0));
