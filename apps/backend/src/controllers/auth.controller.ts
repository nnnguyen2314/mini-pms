import { RequestHandler } from 'express';
import { findUserByEmail, verifyPassword } from '../repositories/user.auth.repository.postgres';
import { signJwt } from '../utils/jwt';
import * as permRepo from '../repositories/permission.repository.postgres';

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
    const token = signJwt({ sub: user.id, email: user.email, name: user.name });
    // Enrich login response with roles and permissions so clients don't need an extra call
    const roles = await permRepo.getEffectiveRoles(user.id);
    const permissions = await permRepo.getPermissionsForRoles(roles);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, status: user.status, roles }, roles, permissions });
  } catch (e) {
    res.status(500).json({ message: 'Login failed' });
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
