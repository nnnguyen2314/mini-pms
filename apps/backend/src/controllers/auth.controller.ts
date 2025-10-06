import { RequestHandler } from 'express';
import { findUserByEmail, verifyPassword } from '../repositories/user.auth.repository.postgres';
import { signAccessToken, signRefreshToken, randomId, verifyRefreshToken } from '../utils/jwt';
import * as permRepo from '../repositories/permission.repository.postgres';
import { refreshCookieOptions } from '../middlewares/security.middleware';
import { getSession, markUsed, purgeExpired, revokeFamily, saveSession } from '../utils/refresh-store';

export const login: RequestHandler = async (req, res) => {
  try {
    const { email, password } = (req as any).body || {};
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }
    const user = await findUserByEmail(email);
    if (!user || !verifyPassword(password, user.password_hash)) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const accessToken = signAccessToken({ sub: user.id, email: user.email, name: user.name });
    const familyId = randomId(12);
    const jti = randomId(16);
    const now = Math.floor(Date.now() / 1000);
    const refreshExp = now + 30 * 24 * 60 * 60; // 30 days
    const refreshToken = signRefreshToken({ sub: user.id, email: user.email, name: user.name, jti }, refreshExp - now);

    saveSession({ jti, userId: user.id, familyId, exp: refreshExp });

    // Set secure HttpOnly refresh cookie
    res.cookie('refresh_token', refreshToken, refreshCookieOptions());

    // Enrich login response with roles and permissions so clients don't need an extra call
    const roles = await permRepo.getEffectiveRoles(user.id);
    const permissions = await permRepo.getPermissionsForRoles(roles);
    res.json({ token: accessToken, user: { id: user.id, email: user.email, name: user.name, status: user.status, roles }, roles, permissions, expiresIn: 15 * 60 });
  } catch (e) {
    res.status(500).json({ message: 'Login failed' });
  }
};

export const refresh: RequestHandler = async (req, res) => {
  try {
    purgeExpired();
    const token = (req.cookies?.refresh_token as string) || '';
    if (!token) { res.status(401).json({ message: 'No refresh token' }); return; }
    const payload: any = verifyRefreshToken(token);
    if (!payload?.jti || !payload?.sub) { res.status(401).json({ message: 'Invalid refresh token' }); return; }

    const session = getSession(payload.jti);
    if (!session) {
      // Possible reuse; revoke the whole family if we can infer it (not available), so just deny
      res.status(401).json({ message: 'Refresh token not found' });
      return;
    }
    if (session.revoked) {
      revokeFamily(session.familyId);
      res.status(401).json({ message: 'Refresh token revoked' });
      return;
    }
    const now = Math.floor(Date.now() / 1000);
    if (session.exp <= now) { res.status(401).json({ message: 'Refresh token expired' }); return; }

    // Rotation: mark old used and issue new refresh with same familyId but new jti
    markUsed(session.jti);
    const newJti = randomId(16);
    const newExp = now + 30 * 24 * 60 * 60;
    const newRefresh = signRefreshToken({ sub: session.userId, jti: newJti }, newExp - now);
    saveSession({ jti: newJti, userId: session.userId, familyId: session.familyId, exp: newExp });

    // New access token
    const accessToken = signAccessToken({ sub: session.userId });

    res.cookie('refresh_token', newRefresh, refreshCookieOptions());
    res.json({ token: accessToken, expiresIn: 15 * 60 });
  } catch (e) {
    res.status(500).json({ message: 'Refresh failed' });
  }
};

export const logout: RequestHandler = async (req, res) => {
  try {
    // Best-effort: clear cookie; clients should discard access token
    res.clearCookie('refresh_token', refreshCookieOptions());
    res.status(204).send();
  } catch {
    res.status(200).json({});
  }
};

export const me: RequestHandler = async (req, res) => {
  try {
    const r = req as any;
    if (!r.userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    // user is loaded by auth middleware if present
    res.json({ user: r.user ?? null });
  } catch (e) {
    res.status(500).json({ message: 'Failed' });
  }
};
