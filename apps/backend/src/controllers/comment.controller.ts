import { Response } from 'express';
import * as repo from '../repositories/comment.repository.postgres';

export async function listForTask(req: any, res: Response): Promise<void> {
  const { taskId } = req.params as any;
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
  const before = req.query.before ? String(req.query.before) : undefined;
  const order = (req.query.order === 'asc' ? 'asc' : undefined) as any;

  if (!taskId) { res.status(400).json({ message: 'taskId is required' }); return; }

  try {
    const items = await repo.listForTask(taskId, { limit, before, order });
    res.json({ items });
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to list comments', error: String(e?.message || e) });
  }
}
