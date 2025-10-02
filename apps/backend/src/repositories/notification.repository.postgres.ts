import { pgPool } from '../config/postgres.config';
import { Notification } from '../entities/notification';

function mapRow(r: any): Notification {
  return {
    id: r.id,
    userId: r.user_id,
    type: r.type,
    title: r.title ?? null,
    body: r.body ?? null,
    entityType: r.entity_type ?? null,
    entityId: r.entity_id ?? null,
    meta: r.meta ?? null,
    isRead: !!r.is_read,
    createdAt: r.created_at?.toISOString?.() ?? r.created_at,
  };
}

export async function listForUser(userId: string, options?: {
  limit?: number;
  before?: string | null; // ISO
  unreadOnly?: boolean;
  type?: string | null;
  entityType?: string | null;
  order?: 'asc' | 'desc';
}): Promise<Notification[]> {
  const limit = Math.min(Math.max(options?.limit ?? 20, 1), 100);
  const before = options?.before ?? null;
  const unreadOnly = !!options?.unreadOnly;
  const type = options?.type ?? null;
  const entityType = options?.entityType ?? null;
  const order = (options?.order === 'asc' ? 'asc' : 'desc');

  let sql = `select * from notifications where user_id = $1`;
  const params: any[] = [userId];
  let p = 2;

  if (before) { sql += ` and created_at < $${p++}`; params.push(before); }
  if (unreadOnly) { sql += ` and is_read = false`; }
  if (type) { sql += ` and type = $${p++}`; params.push(type); }
  if (entityType) { sql += ` and entity_type = $${p++}`; params.push(entityType); }

  sql += ` order by created_at ${order} limit ${limit}`;

  const { rows } = await pgPool.query(sql, params);
  return rows.map(mapRow);
}

export async function createNotification(input: {
  userId: string;
  type: string;
  title?: string | null;
  body?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  meta?: any;
}): Promise<Notification> {
  const { rows } = await pgPool.query(
    `insert into notifications (user_id, type, title, body, entity_type, entity_id, meta)
     values ($1,$2,$3,$4,$5,$6,$7)
     returning *`,
    [input.userId, input.type, input.title ?? null, input.body ?? null, input.entityType ?? null, input.entityId ?? null, input.meta ?? null]
  );
  return mapRow(rows[0]);
}

export async function markRead(id: string, userId: string): Promise<void> {
  await pgPool.query(`update notifications set is_read = true where id = $1 and user_id = $2`, [id, userId]);
}

export async function markAllRead(userId: string): Promise<void> {
  await pgPool.query(`update notifications set is_read = true where user_id = $1 and is_read = false`, [userId]);
}
