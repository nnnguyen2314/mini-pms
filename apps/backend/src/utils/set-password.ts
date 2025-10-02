import dotenv from 'dotenv';
import { pgPool } from '../config/postgres.config';
import { hashPassword } from '../repositories/user.auth.repository.postgres';

dotenv.config();

async function main() {
  const [, , emailArg, passwordArg] = process.argv;
  if (!emailArg || !passwordArg) {
    console.error('Usage: ts-node src/utils/set-password.ts <email> <newPassword>');
    process.exit(1);
  }
  const email = emailArg.trim();
  const plain = passwordArg;

  try {
    const hash = hashPassword(plain);
    const { rowCount, rows } = await pgPool.query(
      `update mini_pms.users set password_hash = $1, updated_at = now() where lower(email) = lower($2) returning id, email`,
      [hash, email]
    );
    if (rowCount === 0) {
      console.error(`No user found with email: ${email}`);
      process.exit(2);
    }
    console.log(`Password updated for user id=${rows[0].id}, email=${rows[0].email}`);
    process.exit(0);
  } catch (e) {
    console.error('Failed to set password:', e);
    process.exit(1);
  }
}

main();
