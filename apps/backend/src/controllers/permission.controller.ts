import { Response } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import * as permRepo from '../repositories/permission.repository.postgres';

export const mePermissions = [authMiddleware, async function mePermissions(req: any, res: Response) {
  try {
    const roles = await permRepo.getEffectiveRoles(req.userId);
    const permissions = await permRepo.getPermissionsForRoles(roles);
    // Keep backward-compatible 'role' field as first role or 'MEMBER'
    const role = roles[0] ?? 'MEMBER';
    res.json({ role, roles, permissions });
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to load permissions', error: String(e?.message || e) });
  }
}];
