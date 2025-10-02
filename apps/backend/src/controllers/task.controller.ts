import { Request, Response } from 'express';
import * as tasks from '../repositories/task.repository.postgres';
import * as activity from '../repositories/activity.repository.postgres';
import * as notifications from '../repositories/notification.repository.postgres';
import * as attachments from '../repositories/attachment.repository.postgres';
import { getS3Client, getS3Settings } from '../config/s3.config';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { TaskStatus } from '../entities/task';

function parseStatus(input: any): number | undefined {
  if (input === undefined) return undefined;
  if (input === null || input === '') return null as any;
  const map: Record<string, number> = {
    '0': TaskStatus.ToDo,
    'to do': TaskStatus.ToDo,
    'todo': TaskStatus.ToDo,
    'open': TaskStatus.ToDo,
    '1': TaskStatus.InProgress,
    'in progress': TaskStatus.InProgress,
    'progress': TaskStatus.InProgress,
    '2': TaskStatus.InReview,
    'in review': TaskStatus.InReview,
    'review': TaskStatus.InReview,
    '3': TaskStatus.Done,
    'done': TaskStatus.Done,
    '4': TaskStatus.Closed,
    'closed': TaskStatus.Closed,
    'close': TaskStatus.Closed,
    '5': TaskStatus.OnHold,
    'on hold': TaskStatus.OnHold,
    'hold': TaskStatus.OnHold,
  };
  if (typeof input === 'number' && Number.isInteger(input)) return input;
  const key = String(input).trim().toLowerCase();
  if (key in map) return map[key];
  const n = parseInt(key, 10);
  if (!Number.isNaN(n) && n >= 0 && n <= 5) return n;
  return undefined;
}

async function addAttachmentsFromRequest(taskId: string, req: any): Promise<void> {
  const files = (req as any).files as Express.Multer.File[] | undefined;
  if (!files || !files.length) return;
  const settings = getS3Settings();

  for (const file of files) {
    try {
      if (settings.provider === 's3') {
        const ts = Date.now();
        const safe = (file.originalname || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
        const key = `${ts}-${safe}`;
        const s3 = getS3Client();
        await s3.send(new PutObjectCommand({
          Bucket: settings.bucket!,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }));
        const publicUrl = settings.publicUrlBase
          ? `${settings.publicUrlBase.replace(/\/$/, '')}/${encodeURIComponent(key)}`
          : (settings.region && settings.bucket)
            ? `https://${settings.bucket}.s3.${settings.region}.amazonaws.com/${encodeURIComponent(key)}`
            : null;
        await attachments.createAttachment({
          taskId,
          uploaderId: req.userId,
          filename: key,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          storageProvider: 's3',
          url: publicUrl,
        });
      } else {
        // Local storage: multer saved to disk and provided a generated filename
        const fname = (file as any).filename || file.originalname;
        const publicUrl = fname ? `/uploads/${fname}` : null;
        await attachments.createAttachment({
          taskId,
          uploaderId: req.userId,
          filename: fname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          storageProvider: 'local',
          url: publicUrl,
        });
      }
    } catch (e) {
      // Skip failed file to not fail the whole task request
    }
  }
}

export async function createTask(req: any, res: Response): Promise<void> {
  const { projectId } = req.params;
  const { boardId, columnId, title, description, status, priority, dueDate } = req.body || {};
  if (!projectId || !boardId || !title) {
    res.status(400).json({ message: 'projectId (path), boardId, and title are required' });
    return;
  }
  const parsedStatus = parseStatus(status);
  if (status !== undefined && parsedStatus === undefined) {
    res.status(400).json({ message: 'Invalid status. Use 0:to do, 1:in progress, 2:in review, 3:done, 4:closed, 5:on hold' });
    return;
  }
  try {
    const t = await tasks.create({
      projectId,
      boardId,
      columnId: columnId ?? null,
      title,
      description: description ?? null,
      status: parsedStatus ?? null,
      priority: priority ?? null,
      dueDate: dueDate ?? null,
      createdBy: req.userId,
    });
    await activity.add({ projectId: t.projectId, taskId: t.id, actorId: req.userId, action: 'task_created', meta: { title: t.title } });
    await addAttachmentsFromRequest(t.id, req);
    res.status(201).json(t);
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to create task', error: String(e?.message || e) });
  }
}

export async function getTask(req: Request, res: Response): Promise<void> {
  const { id } = req.params as any;
  try {
    const t = await tasks.getById(id);
    if (!t) { res.status(404).json({ message: 'Task not found' }); return; }
    res.json(t);
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to fetch task', error: String(e?.message || e) });
  }
}

export async function listProjectTasks(req: Request, res: Response): Promise<void> {
  const { projectId } = req.params as any;
  const boardId = req.query.boardId ? String(req.query.boardId) : undefined;
  const columnId = req.query.columnId ? String(req.query.columnId) : undefined;
  const statusRaw = req.query.status as any;
  const q = req.query.q ? String(req.query.q) : undefined;
  const assigneeId = req.query.assigneeId ? String(req.query.assigneeId) : undefined;
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
  const before = req.query.before ? String(req.query.before) : undefined;
  const order = (req.query.order === 'asc' ? 'asc' : undefined) as any;
  if (!projectId) { res.status(400).json({ message: 'projectId is required' }); return; }
  const parsedStatus = parseStatus(statusRaw);
  if (statusRaw !== undefined && parsedStatus === undefined) {
    res.status(400).json({ message: 'Invalid status. Use 0..5 or names.' });
    return;
  }
  try {
    const items = await tasks.listByProject(projectId, { boardId, columnId, status: parsedStatus ?? null, q, assigneeId, limit, before, order });
    res.json({ items });
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to list tasks', error: String(e?.message || e) });
  }
}

export async function updateTask(req: any, res: Response): Promise<void> {
  const { id } = req.params;
  const { title, description, status, priority, dueDate, boardId, columnId } = req.body || {};
  const parsedStatus = parseStatus(status);
  if (status !== undefined && parsedStatus === undefined) {
    res.status(400).json({ message: 'Invalid status. Use 0:to do, 1:in progress, 2:in review, 3:done, 4:closed, 5:on hold' });
    return;
  }
  try {
    const before = await tasks.getById(id);
    if (!before) { res.status(404).json({ message: 'Task not found' }); return; }
    const t = await tasks.update(id, { title, description, status: parsedStatus ?? null, priority, dueDate, boardId, columnId });
    if (!t) { res.status(404).json({ message: 'Task not found after update' }); return; }
    const changed: any = {};
    for (const k of ['title','description','status','priority','dueDate','boardId','columnId'] as const) {
      if ((before as any)[k] !== (t as any)[k]) changed[k] = { from: (before as any)[k], to: (t as any)[k] };
    }
    await activity.add({ projectId: t.projectId, taskId: t.id, actorId: req.userId, action: 'task_updated', meta: { changed } });
    await addAttachmentsFromRequest(id, req);
    res.json(t);
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to update task', error: String(e?.message || e) });
  }
}

export async function deleteTask(req: any, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const t = await tasks.getById(id);
    if (!t) { res.status(404).json({ message: 'Task not found' }); return; }
    await tasks.remove(id);
    await activity.add({ projectId: t.projectId, taskId: id, actorId: req.userId, action: 'task_deleted', meta: { title: t.title } });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to delete task', error: String(e?.message || e) });
  }
}

export async function listAssignees(req: Request, res: Response): Promise<void> {
  const { id } = req.params as any;
  try {
    const userIds = await tasks.listAssignees(id);
    res.json({ items: userIds });
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to list assignees', error: String(e?.message || e) });
  }
}

export async function assignUser(req: any, res: Response): Promise<void> {
  const { id } = req.params;
  const { userId } = req.body || {};
  if (!userId) { res.status(400).json({ message: 'userId is required' }); return; }
  try {
    const t = await tasks.getById(id);
    if (!t) { res.status(404).json({ message: 'Task not found' }); return; }
    await tasks.assign(id, userId);
    await activity.add({ projectId: t.projectId, taskId: id, actorId: req.userId, action: 'task_assigned', meta: { userId } });
    if (userId !== req.userId) {
      try {
        await notifications.createNotification({ userId, type: 'task_assigned', title: 'You were assigned to a task', body: t.title, entityType: 'task', entityId: id, meta: { projectId: t.projectId } });
      } catch {}
    }
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to assign user', error: String(e?.message || e) });
  }
}

export async function unassignUser(req: any, res: Response): Promise<void> {
  const { id, userId } = req.params;
  try {
    const t = await tasks.getById(id);
    if (!t) { res.status(404).json({ message: 'Task not found' }); return; }
    await tasks.unassign(id, userId);
    await activity.add({ projectId: t.projectId, taskId: id, actorId: req.userId, action: 'task_unassigned', meta: { userId } });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to unassign user', error: String(e?.message || e) });
  }
}
