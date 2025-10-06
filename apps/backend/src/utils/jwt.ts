import crypto from 'crypto';

// Minimal HS256 JWT implementation to avoid extra deps
// Token format: header.payload.signature (base64url)

function base64url(input: Buffer | string): string {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return b
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function parseBase64url<T = any>(s: string): T {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = 4 - (s.length % 4);
  if (pad !== 4) s = s + '='.repeat(pad);
  const json = Buffer.from(s, 'base64').toString('utf8');
  return JSON.parse(json);
}

export interface JwtPayload {
  sub: string; // user id
  email?: string;
  name?: string;
  iat: number;
  exp: number;
  [key: string]: any;
}

export function signJwt(payload: Omit<JwtPayload, 'iat' | 'exp'>, opts?: { expiresInSec?: number; secretEnvVar?: string }): string {
  const secret = process.env[opts?.secretEnvVar || 'JWT_SECRET'] || 'dev_secret_change_me';
  const header = { alg: 'HS256', typ: 'JWT' };
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + (opts?.expiresInSec ?? 60 * 60 * 24 * 7); // default 7 days
  const body: JwtPayload = { ...payload, iat, exp } as JwtPayload;

  const h = base64url(JSON.stringify(header));
  const p = base64url(JSON.stringify(body));
  const data = `${h}.${p}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest();
  const s = base64url(sig);
  return `${data}.${s}`;
}

export function verifyJwt<T = JwtPayload>(token: string, opts?: { secretEnvVar?: string }): T | null {
  try {
    const secret = process.env[opts?.secretEnvVar || 'JWT_SECRET'] || 'dev_secret_change_me';
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    const data = `${h}.${p}`;
    const expected = base64url(crypto.createHmac('sha256', secret).update(data).digest());
    if (expected !== s) return null;
    const payload = parseBase64url<T>(p);
    const now = Math.floor(Date.now() / 1000);
    // @ts-ignore
    if (payload.exp && payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}

// Helpers dedicated to access and refresh tokens
export function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>, expiresInSec = 15 * 60): string {
  return signJwt(payload, { expiresInSec, secretEnvVar: 'JWT_SECRET' });
}

export function signRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'> & { jti: string }, expiresInSec = 30 * 24 * 60 * 60): string {
  // Optionally use a different secret for refresh tokens if provided
  const secretVar = process.env.JWT_REFRESH_SECRET ? 'JWT_REFRESH_SECRET' : 'JWT_SECRET';
  return signJwt(payload, { expiresInSec, secretEnvVar: secretVar });
}

export function verifyAccessToken<T = JwtPayload>(token: string): T | null {
  return verifyJwt<T>(token, { secretEnvVar: 'JWT_SECRET' });
}

export function verifyRefreshToken<T = JwtPayload & { jti?: string }>(token: string): T | null {
  const secretVar = process.env.JWT_REFRESH_SECRET ? 'JWT_REFRESH_SECRET' : 'JWT_SECRET';
  return verifyJwt<T>(token, { secretEnvVar: secretVar });
}

export function randomId(bytes: number = 16): string {
  return base64url(crypto.randomBytes(bytes));
}
