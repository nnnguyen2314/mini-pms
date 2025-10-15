// Refresh token store with optional Redis backend
// Falls back to in-memory Map when Redis is not configured/available.
import { getRedis } from './redis';

export interface RefreshSession {
  jti: string;
  userId: string;
  familyId: string; // group tokens belonging to the same login session
  exp: number; // seconds since epoch
  revoked?: boolean;
  usedAt?: number; // seconds since epoch
}

const sessions = new Map<string, RefreshSession>(); // in-memory fallback
const key = (jti: string) => `refresh:${jti}`;
const famKey = (familyId: string) => `refreshfam:${familyId}`;

export async function saveSession(session: RefreshSession): Promise<void> {
  sessions.set(session.jti, session);
  const r = getRedis();
  if (!r) return;
  const ttl = Math.max(1, session.exp - Math.floor(Date.now() / 1000));
  await r.set(key(session.jti), JSON.stringify(session), 'EX', ttl);
  await r.sadd(famKey(session.familyId), session.jti);
  await r.expire(famKey(session.familyId), ttl);
}

export async function getSession(jti: string): Promise<RefreshSession | undefined> {
  const r = getRedis();
  if (r) {
    const raw = await r.get(key(jti));
    if (raw) {
      try { return JSON.parse(raw) as RefreshSession; } catch { /* fall through */ }
    }
    return undefined;
  }
  return sessions.get(jti);
}

export async function markUsed(jti: string): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const r = getRedis();
  if (r) {
    const raw = await r.get(key(jti));
    if (raw) {
      try {
        const s = JSON.parse(raw) as RefreshSession;
        s.usedAt = now;
        const ttl = Math.max(1, s.exp - now);
        await r.set(key(jti), JSON.stringify(s), 'EX', ttl);
      } catch { /* ignore */ }
    }
    return;
  }
  const s = sessions.get(jti);
  if (s) {
    s.usedAt = now;
    sessions.set(jti, s);
  }
}

export async function revokeFamily(familyId: string): Promise<void> {
  const r = getRedis();
  if (r) {
    const members = await r.smembers(famKey(familyId));
    if (members?.length) {
      for (const jti of members) {
        const raw = await r.get(key(jti));
        if (raw) {
          try {
            const s = JSON.parse(raw) as RefreshSession;
            s.revoked = true;
            const ttl = Math.max(1, s.exp - Math.floor(Date.now() / 1000));
            await r.set(key(jti), JSON.stringify(s), 'EX', ttl);
          } catch { /* ignore */ }
        }
      }
    }
    return;
  }
  for (const s of sessions.values()) {
    if (s.familyId === familyId) s.revoked = true;
  }
}

export async function remove(jti: string): Promise<void> {
  const r = getRedis();
  if (r) {
    // Best-effort: delete session and remove from any family set if we know it
    const raw = await r.get(key(jti));
    if (raw) {
      try {
        const s = JSON.parse(raw) as RefreshSession;
        await r.srem(famKey(s.familyId), jti);
      } catch { /* ignore */ }
    }
    await r.del(key(jti));
    return;
  }
  sessions.delete(jti);
}

export async function purgeExpired(nowSec = Math.floor(Date.now() / 1000)): Promise<void> {
  const r = getRedis();
  if (r) {
    // Redis uses TTL; nothing to do here
    return;
  }
  for (const [jti, s] of sessions.entries()) {
    if (s.exp <= nowSec) sessions.delete(jti);
  }
}
