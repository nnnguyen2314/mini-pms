import { Response } from 'express';
import * as repo from '../repositories/activity.repository.postgres';

export async function listActivity(req: any, res: Response): Promise<void> {
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
  const before = req.query.before ? String(req.query.before) : undefined;
  const workspaceId = req.query.workspaceId ? String(req.query.workspaceId) : undefined;
  const projectId = req.query.projectId ? String(req.query.projectId) : undefined;
  const taskId = req.query.taskId ? String(req.query.taskId) : undefined;
  const action = req.query.action ? String(req.query.action) : undefined;
  const actorId = req.query.actorId ? String(req.query.actorId) : undefined;
  const from = req.query.from ? String(req.query.from) : undefined;
  const to = req.query.to ? String(req.query.to) : undefined;
  const order = (req.query.order === 'asc' ? 'asc' : undefined) as any;
  try {
    const items = await repo.list({ limit, before, workspaceId, projectId, taskId, action, actorId, from, to, order });
    res.json({ items });
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to fetch activity logs', error: String(e?.message || e) });
  }
}

export async function listTaskActivity(req: any, res: Response): Promise<void> {
  const { taskId } = req.params;
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
  const before = req.query.before ? String(req.query.before) : undefined;
  const action = req.query.action ? String(req.query.action) : undefined;
  const actorId = req.query.actorId ? String(req.query.actorId) : undefined;
  const from = req.query.from ? String(req.query.from) : undefined;
  const to = req.query.to ? String(req.query.to) : undefined;
  const order = (req.query.order === 'asc' ? 'asc' : undefined) as any;

  if (!taskId) {
    res.status(400).json({ message: 'taskId is required' });
    return;
  }

  try {
    const items = await repo.listForTask(taskId, { limit, before, action, actorId, from, to, order });
    res.json({ items });
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to fetch activity logs', error: String(e?.message || e) });
  }
}
