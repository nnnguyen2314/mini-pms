import { Request, Response } from 'express';
import * as activity from '../repositories/activity.repository.postgres';
import * as wsRepo from '../repositories/workspace.repository.postgres';
import * as projRepo from '../repositories/project.repository.postgres';

export async function getMe(req: any, res: Response): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const user = req.user || { id: req.userId };
  res.json({ user });
}

export async function getMyRecentWorkspaces(req: any, res: Response): Promise<void> {
  const userId = req.userId as string;
  if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }
  const limit = req.query.limit ? Math.min(Math.max(parseInt(String(req.query.limit), 10) || 10, 1), 50) : 10;
  try {
    const recents = await activity.recentWorkspaceIdsForUser(userId, limit);
    const ids = recents.map(r => r.id);
    const items = await wsRepo.listByIds(ids);
    // Map by id for quick lookup and order by recents
    const map = new Map(items.map(i => [i.id, i] as const));
    const ordered = recents.map(r => ({ ...map.get(r.id)!, lastActivityAt: r.lastActivityAt })).filter(x => !!x && !!x.id);
    res.json({ items: ordered });
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to fetch recent workspaces', error: String(e?.message || e) });
  }
}

export async function getMyRecentProjects(req: any, res: Response): Promise<void> {
  const userId = req.userId as string;
  if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }
  const limit = req.query.limit ? Math.min(Math.max(parseInt(String(req.query.limit), 10) || 10, 1), 50) : 10;
  try {
    const recents = await activity.recentProjectIdsForUser(userId, limit);
    const ids = recents.map(r => r.id);
    const items = await projRepo.listByIds(ids);
    const map = new Map(items.map(i => [i.id, i] as const));
    const ordered = recents.map(r => ({ ...map.get(r.id)!, lastActivityAt: r.lastActivityAt })).filter(x => !!x && !!x.id);
    res.json({ items: ordered });
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to fetch recent projects', error: String(e?.message || e) });
  }
}

export async function listMyProjects(req: any, res: Response): Promise<void> {
  const userId = req.userId as string;
  if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }
  const q = req.query.q ? String(req.query.q) : undefined;
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
  const before = req.query.before ? String(req.query.before) : undefined;
  const order = (req.query.order === 'asc' ? 'asc' : undefined) as any;
  try {
    const items = await projRepo.listAccessibleForUser(userId, { q: q ?? null, limit, before, order });
    res.json({ items });
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to list my projects', error: String(e?.message || e) });
  }
}
