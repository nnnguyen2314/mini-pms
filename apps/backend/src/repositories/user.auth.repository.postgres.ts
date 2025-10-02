import { pgPool } from '../config/postgres.config';
import crypto from 'crypto';

export type DbUser = {
  id: string;
  name: string;
  email: string;
  status: number;
  password_hash: string | null;
};

const TABLE = 'mini_pms.users';

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const { rows } = await pgPool.query(
    `select id, name, email, status, password_hash from ${TABLE} where lower(email) = lower($1)`,
    [email]
  );
  return rows[0] ?? null;
}

// Password hashing: pbkdf2 with sha256, format: pbkdf2$iterations$salt$hexhash
export function verifyPassword(plain: string, password_hash: string | null): boolean {
  if (!password_hash) return false;
  try {
    // Development-friendly format: plain$<password>
    if (password_hash.startsWith('plain$')) {
      const expected = password_hash.slice('plain$'.length);
      if (expected.length !== plain.length) return false;
      return crypto.timingSafeEqual(Buffer.from(plain, 'utf8'), Buffer.from(expected, 'utf8'));
    }

    const [method, iterStr, salt, hash] = password_hash.split('$');
    if (method !== 'pbkdf2') return false;
    const iterations = parseInt(iterStr, 10) || 100000;
    const derived = crypto.pbkdf2Sync(plain, salt, iterations, 32, 'sha256').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

export function hashPassword(plain: string): string {
  const iterations = 120000;
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.pbkdf2Sync(plain, salt, iterations, 32, 'sha256').toString('hex');
  return `pbkdf2$${iterations}$${salt}$${derived}`;
}
