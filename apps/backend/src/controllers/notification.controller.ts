import { Response } from 'express';
import * as repo from '../repositories/notification.repository.postgres';

export async function listMyNotifications(req: any, res: Response): Promise<void> {
  const userId = req.userId as string;
  if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }

  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
  const before = req.query.before ? String(req.query.before) : undefined;
  const unreadOnly = req.query.unreadOnly === 'true' || req.query.unreadOnly === true;
  const type = req.query.type ? String(req.query.type) : undefined;
  const entityType = req.query.entityType ? String(req.query.entityType) : undefined;
  const order = (req.query.order === 'asc' ? 'asc' : undefined) as any;

  try {
    const items = await repo.listForUser(userId, { limit, before, unreadOnly, type, entityType, order });
    res.json({ items });
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to fetch notifications', error: String(e?.message || e) });
  }
}

// Minimal creation endpoint (for system or admin usage). In real app, creation occurs in domain services.
export async function createNotification(req: any, res: Response): Promise<void> {
  const userId = req.body?.userId as string;
  const type = req.body?.type as string;
  if (!userId || !type) { res.status(400).json({ message: 'userId and type are required' }); return; }
  try {
    const notif = await repo.createNotification({
      userId,
      type,
      title: req.body?.title ?? null,
      body: req.body?.body ?? null,
      entityType: req.body?.entityType ?? null,
      entityId: req.body?.entityId ?? null,
      meta: req.body?.meta ?? null,
    });
    res.status(201).json(notif);
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to create notification', error: String(e?.message || e) });
  }
}

export async function markOneRead(req: any, res: Response): Promise<void> {
  const userId = req.userId as string;
  if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }
  const { id } = req.params;
  if (!id) { res.status(400).json({ message: 'id is required' }); return; }
  try {
    await repo.markRead(id, userId);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to mark notification as read', error: String(e?.message || e) });
  }
}

export async function markAllMyRead(req: any, res: Response): Promise<void> {
  const userId = req.userId as string;
  if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }
  try {
    await repo.markAllRead(userId);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to mark all notifications as read', error: String(e?.message || e) });
  }
}
