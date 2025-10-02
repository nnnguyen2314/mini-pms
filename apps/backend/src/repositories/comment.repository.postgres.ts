import { pgPool } from '../config/postgres.config';
import { Comment } from '../entities/comment';

function mapRow(r: any): Comment {
  return {
    id: r.id,
    taskId: r.task_id,
    authorId: r.author_id,
    body: r.body,
    createdAt: r.created_at?.toISOString?.() ?? r.created_at,
    updatedAt: r.updated_at?.toISOString?.() ?? r.updated_at,
  };
}

export async function listForTask(taskId: string, options?: {
  limit?: number;
  before?: string | null; // ISO timestamp cursor on created_at
  order?: 'asc' | 'desc';
}): Promise<Comment[]> {
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 200);
  const before = options?.before ?? null;
  const order = (options?.order === 'asc' ? 'asc' : 'desc');

  let sql = `select * from comments where task_id = $1`;
  const params: any[] = [taskId];
  let p = 2;

  if (before) { sql += ` and created_at < $${p++}`; params.push(before); }

  sql += ` order by created_at ${order} limit ${limit}`;

  const { rows } = await pgPool.query(sql, params);
  return rows.map(mapRow);
}
