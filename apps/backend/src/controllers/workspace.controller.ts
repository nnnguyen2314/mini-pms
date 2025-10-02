import { Request, Response } from 'express';
import * as wsRepo from '../repositories/workspace.repository.postgres';
import { findUserByEmail } from '../repositories/user.auth.repository.postgres';

function parseWorkspaceStatus(input: any): number | undefined {
  if (input === undefined) return undefined;
  if (input === null || input === '') return null as any;
  const map: Record<string, number> = {
    '0': 0, 'inactive': 0,
    '1': 1, 'active': 1,
    '2': 2, 'archived': 2, 'archive': 2,
  };
  if (typeof input === 'number' && Number.isInteger(input)) return input;
  const key = String(input).trim().toLowerCase();
  if (key in map) return map[key];
  const n = parseInt(key, 10);
  if (!Number.isNaN(n) && n >= 0 && n <= 2) return n;
  return undefined;
}

export async function listMine(req: any, res: Response): Promise<void> {
  try {
    const status = parseWorkspaceStatus(req.query?.status);
    const sortBy = req.query?.sortBy as any;
    const sortDir = req.query?.sortDir as any;
    const items = await wsRepo.listWorkspacesForUser(req.userId, { status, sortBy, sortDir });
    res.json({ items });
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to list workspaces', error: String(e?.message || e) });
  }
}

export async function create(req: any, res: Response): Promise<void> {
  const { name, description, status } = req.body || {};
  if (!name) {
    res.status(400).json({ message: 'name is required' });
    return;
  }
  const parsedStatus = parseWorkspaceStatus(status);
  if (status !== undefined && parsedStatus === undefined) {
    res.status(400).json({ message: 'Invalid status. Use 0:inactive, 1:active, 2:archived' });
    return;
  }
  try {
    const ws = await wsRepo.createWorkspace(req.userId, { name, description, status: parsedStatus ?? null });
    res.status(201).json(ws);
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to create workspace', error: String(e?.message || e) });
  }
}

export async function getById(req: any, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const ws = await wsRepo.getWorkspaceById(id);
    if (!ws) {
      res.status(404).json({ message: 'Workspace not found' });
      return;
    }
    res.json(ws);
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to get workspace', error: String(e?.message || e) });
  }
}

export async function update(req: any, res: Response): Promise<void> {
  const { id } = req.params;
  const { name, description, status } = req.body || {};
  const parsedStatus = parseWorkspaceStatus(status);
  if (status !== undefined && parsedStatus === undefined) {
    res.status(400).json({ message: 'Invalid status. Use 0:inactive, 1:active, 2:archived' });
    return;
  }
  try {
    const ws = await wsRepo.updateWorkspace(id, { name, description, status: parsedStatus ?? null });
    if (!ws) {
      res.status(404).json({ message: 'Workspace not found' });
      return;
    }
    res.json(ws);
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to update workspace', error: String(e?.message || e) });
  }
}

export async function destroy(req: any, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const actorRole = await wsRepo.getMemberRole(id, req.userId);
    if (!actorRole || (actorRole !== 'WORKSPACE_OWNER' && actorRole !== 'ADMIN')) {
      res.status(403).json({ message: 'Only workspace WORKSPACE_OWNER or ADMIN can delete' });
      return;
    }
    const ok = await wsRepo.deleteWorkspace(id);
    if (!ok) { res.status(404).json({ message: 'Workspace not found' }); return; }
    res.status(204).send();
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to delete workspace', error: String(e?.message || e) });
  }
}

export async function addMember(req: any, res: Response): Promise<void> {
  const { id } = req.params; // workspace id
  const { userId, role } = req.body || {};
  if (!userId) { res.status(400).json({ message: 'userId is required' }); return; }
  try {
    // Only WORKSPACE_OWNER or ADMIN of the workspace can manage members
    const actorRole = await wsRepo.getMemberRole(id, req.userId);
    if (!actorRole || (actorRole !== 'WORKSPACE_OWNER' && actorRole !== 'ADMIN')) {
      res.status(403).json({ message: 'Only workspace WORKSPACE_OWNER or ADMIN can add members' });
      return;
    }
    const normalizedRole = (role === 'ADMIN' || role === 'MEMBER' || role === 'GUEST') ? role : 'MEMBER';
    await wsRepo.addMember(id, userId, normalizedRole as any);
    res.status(204).send();
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to add member to workspace', error: String(e?.message || e) });
  }
}

export async function inviteByEmail(req: any, res: Response): Promise<void> {
  const { id } = req.params;
  const { email, role } = req.body || {};
  if (!email) { res.status(400).json({ message: 'email is required' }); return; }
  try {
    const actorRole = await wsRepo.getMemberRole(id, req.userId);
    if (!actorRole || (actorRole !== 'WORKSPACE_OWNER' && actorRole !== 'ADMIN')) {
      res.status(403).json({ message: 'Only workspace WORKSPACE_OWNER or ADMIN can invite members' });
      return;
    }
    const normalizedRole = (role === 'ADMIN' || role === 'MEMBER' || role === 'GUEST') ? role : 'MEMBER';
    // find existing user
    let user = await findUserByEmail(email);
    if (!user) {
      // Create a shell user record (inactive) with no password; user can complete profile later
      const { pgPool } = await import('../config/postgres.config');
      const { rows } = await pgPool.query(`insert into mini_pms.users (name, email, status) values ($1,$2,$3) returning id`, [email.split('@')[0], email, 0]);
      const idCreated = rows?.[0]?.id;
      user = idCreated ? { id: idCreated } as any : null;
    }
    if (!user) { res.status(400).json({ message: 'Failed to create or find user' }); return; }
    await wsRepo.addMember(id, user.id, normalizedRole as any);
    res.status(204).send();
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to invite member by email', error: String(e?.message || e) });
  }
}

export async function removeMember(req: any, res: Response): Promise<void> {
  const { id, userId } = req.params; // workspace id and member userId
  try {
    const actorRole = await wsRepo.getMemberRole(id, req.userId);
    if (!actorRole || (actorRole !== 'WORKSPACE_OWNER' && actorRole !== 'ADMIN')) {
      res.status(403).json({ message: 'Only workspace WORKSPACE_OWNER or ADMIN can remove members' });
      return;
    }
    // Prevent removing WORKSPACE_OWNER via this endpoint
    const targetRole = await wsRepo.getMemberRole(id, userId);
    if (targetRole === 'WORKSPACE_OWNER') {
      res.status(400).json({ message: 'Cannot remove workspace WORKSPACE_OWNER' });
      return;
    }
    await wsRepo.removeMember(id, userId);
    res.status(204).send();
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to remove member from workspace', error: String(e?.message || e) });
  }
}
