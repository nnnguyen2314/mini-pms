// Simple in-memory refresh token store with rotation support
// Note: Suitable for a single-process demo/dev. For production, use a shared store (DB/Redis).

export interface RefreshSession {
  jti: string;
  userId: string;
  familyId: string; // group tokens belonging to the same login session
  exp: number; // seconds since epoch
  revoked?: boolean;
  usedAt?: number; // seconds since epoch
}

const sessions = new Map<string, RefreshSession>(); // key: jti

export function saveSession(session: RefreshSession) {
  sessions.set(session.jti, session);
}

export function getSession(jti: string): RefreshSession | undefined {
  return sessions.get(jti);
}

export function markUsed(jti: string) {
  const s = sessions.get(jti);
  if (s) {
    s.usedAt = Math.floor(Date.now() / 1000);
    sessions.set(jti, s);
  }
}

export function revokeFamily(familyId: string) {
  for (const s of sessions.values()) {
    if (s.familyId === familyId) {
      s.revoked = true;
    }
  }
}

export function remove(jti: string) {
  sessions.delete(jti);
}

export function purgeExpired(nowSec = Math.floor(Date.now() / 1000)) {
  for (const [jti, s] of sessions.entries()) {
    if (s.exp <= nowSec) sessions.delete(jti);
  }
}
