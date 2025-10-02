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

export function signJwt(payload: Omit<JwtPayload, 'iat' | 'exp'>, opts?: { expiresInSec?: number }): string {
  const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
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

export function verifyJwt<T = JwtPayload>(token: string): T | null {
  try {
    const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    const data = `${h}.${p}`;
    const expected = base64url(crypto.createHmac('sha256', secret).update(data).digest());
    console.log(expected);
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
