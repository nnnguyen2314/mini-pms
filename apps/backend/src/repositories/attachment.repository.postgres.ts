import { pgPool } from '../config/postgres.config';
import { TaskAttachment } from '../entities/attachment';

function mapRow(r: any): TaskAttachment {
  return {
    id: r.id,
    taskId: r.task_id,
    uploaderId: r.uploader_id,
    filename: r.filename,
    mimeType: r.mime_type ?? null,
    sizeBytes: r.size_bytes !== null && r.size_bytes !== undefined ? Number(r.size_bytes) : null,
    storageProvider: r.storage_provider ?? null,
    url: r.url ?? null,
    createdAt: r.created_at?.toISOString?.() ?? r.created_at,
  };
}

export async function listByTask(taskId: string): Promise<TaskAttachment[]> {
  const { rows } = await pgPool.query(
    `select * from task_attachments where task_id = $1 order by created_at asc`,
    [taskId]
  );
  return rows.map(mapRow);
}

export async function createAttachment(input: {
  taskId: string;
  uploaderId: string;
  filename: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  storageProvider?: string | null;
  url?: string | null;
}): Promise<TaskAttachment> {
  const { rows } = await pgPool.query(
    `insert into task_attachments (task_id, uploader_id, filename, mime_type, size_bytes, storage_provider, url)
     values ($1,$2,$3,$4,$5,$6,$7)
     returning *`,
    [
      input.taskId,
      input.uploaderId,
      input.filename,
      input.mimeType ?? null,
      input.sizeBytes ?? null,
      input.storageProvider ?? null,
      input.url ?? null,
    ]
  );
  return mapRow(rows[0]);
}

export async function deleteAttachment(id: string): Promise<void> {
  await pgPool.query(`delete from task_attachments where id = $1`, [id]);
}

export async function getById(id: string): Promise<TaskAttachment | null> {
  const { rows } = await pgPool.query(`select * from task_attachments where id = $1`, [id]);
  if (!rows?.length) return null;
  return mapRow(rows[0]);
}
