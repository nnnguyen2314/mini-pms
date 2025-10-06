import { Request, Response, NextFunction } from 'express';

// Very small per-IP rate limiter (in-memory)
export function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 100 }: { windowMs?: number; max?: number }) {
  type Entry = { count: number; expiresAt: number };
  const store = new Map<string, Entry>();

  function cleanup() {
    const now = Date.now();
    for (const [k, v] of store.entries()) {
      if (v.expiresAt <= now) store.delete(k);
    }
  }

  setInterval(cleanup, Math.min(windowMs, 60_000)).unref?.();

  return function rateLimiter(req: Request, res: Response, next: NextFunction) {
    const ip = (req.ip || req.socket.remoteAddress || 'unknown') + ':' + (req.path || '');
    const now = Date.now();
    const entry = store.get(ip);
    if (!entry || entry.expiresAt <= now) {
      store.set(ip, { count: 1, expiresAt: now + windowMs });
      return next();
    }
    if (entry.count >= max) {
      res.status(429).json({ message: 'Too many requests' });
      return;
    }
    entry.count += 1;
    store.set(ip, entry);
    next();
  };
}

// CSRF protection helper for cookie-auth endpoints
// - Ensures same-origin by validating Origin/Referer host matches Host header
// - Only allows same-site requests
export function requireSameOrigin(req: Request, res: Response, next: NextFunction) {
  try {
    const origin = (req.headers.origin || '') as string;
    const referer = (req.headers.referer || req.headers.referrer || '') as string;
    const host = (req.headers.host || '') as string;

    const check = (urlStr: string) => {
      if (!urlStr) return true; // allow missing headers
      try { return new URL(urlStr).host === host; } catch { return false; }
    };

    if (!check(origin) || !check(referer)) {
      res.status(403).json({ message: 'CSRF protection: cross-site request blocked' });
      return;
    }
    next();
  } catch {
    res.status(403).json({ message: 'CSRF protection error' });
    return;
  }
}

export function refreshCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  const secure = process.env.COOKIE_SECURE === 'true' || isProd; // can be overridden
  const sameSite: any = 'strict';
  const domain = process.env.COOKIE_DOMAIN; // optional
  return { httpOnly: true, secure, sameSite, path: '/api/auth', domain };
}
