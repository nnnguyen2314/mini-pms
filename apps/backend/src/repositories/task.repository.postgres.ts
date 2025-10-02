import { pgPool } from '../config/postgres.config';
import { Task } from '../entities/task';

function toStatusNumber(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  const n = parseInt(String(value), 10);
  return Number.isNaN(n) ? null : n;
}

function mapRow(r: any): Task {
  return {
    id: r.id,
    projectId: r.project_id,
    boardId: r.board_id,
    columnId: r.column_id ?? null,
    title: r.title,
    description: r.description ?? null,
    status: toStatusNumber(r.status),
    priority: r.priority ?? null,
    dueDate: r.due_date ? (typeof r.due_date === 'string' ? r.due_date : r.due_date.toISOString().slice(0,10)) : null,
    createdBy: r.created_by,
    createdAt: r.created_at?.toISOString?.() ?? r.created_at,
    updatedAt: r.updated_at?.toISOString?.() ?? r.updated_at,
  };
}

export async function create(input: {
  projectId: string;
  boardId: string;
  columnId?: string | null;
  title: string;
  description?: string | null;
  status?: number | null;
  priority?: string | null;
  dueDate?: string | null; // YYYY-MM-DD
  createdBy: string;
}): Promise<Task> {
  const { rows } = await pgPool.query(
    `insert into tasks (project_id, board_id, column_id, title, description, status, priority, due_date, created_by)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     returning *`,
    [
      input.projectId,
      input.boardId,
      input.columnId ?? null,
      input.title,
      input.description ?? null,
      input.status === undefined || input.status === null ? null : String(input.status),
      input.priority ?? null,
      input.dueDate ?? null,
      input.createdBy,
    ]
  );
  return mapRow(rows[0]);
}

export async function getById(id: string): Promise<Task | null> {
  const { rows } = await pgPool.query(`select * from tasks where id = $1`, [id]);
  if (!rows?.length) return null;
  return mapRow(rows[0]);
}

export async function listByProject(projectId: string, options?: {
  boardId?: string | null;
  columnId?: string | null;
  status?: number | null;
  q?: string | null; // search in title
  assigneeId?: string | null;
  limit?: number;
  before?: string | null; // ISO timestamp cursor on updated_at
  order?: 'asc' | 'desc'; // by updated_at
}): Promise<Task[]> {
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 200);
  const before = options?.before ?? null;
  const boardId = options?.boardId ?? null;
  const columnId = options?.columnId ?? null;
  const status = options?.status ?? null;
  const q = options?.q ?? null;
  const assigneeId = options?.assigneeId ?? null;
  const order = (options?.order === 'asc' ? 'asc' : 'desc');

  let sql = `select t.* from tasks t`;
  const params: any[] = [projectId];
  let p = 2;

  if (assigneeId) {
    sql += ` join task_assignees ta on ta.task_id = t.id and ta.user_id = $${p++}`;
    params.push(assigneeId);
  }
  sql += ` where t.project_id = $1`;

  if (boardId) { sql += ` and t.board_id = $${p++}`; params.push(boardId); }
  if (columnId) { sql += ` and t.column_id = $${p++}`; params.push(columnId); }
  if (status !== null && status !== undefined) { sql += ` and t.status = $${p++}`; params.push(String(status)); }
  if (q) { sql += ` and t.title ilike $${p++}`; params.push(`%${q}%`); }
  if (before) { sql += ` and t.updated_at < $${p++}`; params.push(before); }

  sql += ` order by t.updated_at ${order} limit ${limit}`;

  const { rows } = await pgPool.query(sql, params);
  return rows.map(mapRow);
}

export async function update(id: string, patch: {
  title?: string;
  description?: string | null;
  status?: number | null;
  priority?: string | null;
  dueDate?: string | null;
  boardId?: string;
  columnId?: string | null;
}): Promise<Task | null> {
  const sets: string[] = [];
  const params: any[] = [];
  let p = 1;
  if (patch.title !== undefined) { sets.push(`title = $${p++}`); params.push(patch.title); }
  if (patch.description !== undefined) { sets.push(`description = $${p++}`); params.push(patch.description); }
  if (patch.status !== undefined) { sets.push(`status = $${p++}`); params.push(patch.status === null ? null : String(patch.status)); }
  if (patch.priority !== undefined) { sets.push(`priority = $${p++}`); params.push(patch.priority); }
  if (patch.dueDate !== undefined) { sets.push(`due_date = $${p++}`); params.push(patch.dueDate); }
  if (patch.boardId !== undefined) { sets.push(`board_id = $${p++}`); params.push(patch.boardId); }
  if (patch.columnId !== undefined) { sets.push(`column_id = $${p++}`); params.push(patch.columnId); }
  if (!sets.length) {
    return await getById(id);
  }
  const sql = `update tasks set ${sets.join(', ')} where id = $${p} returning *`;
  params.push(id);
  const { rows } = await pgPool.query(sql, params);
  if (!rows?.length) return null;
  return mapRow(rows[0]);
}

export async function remove(id: string): Promise<void> {
  await pgPool.query(`delete from tasks where id = $1`, [id]);
}

export async function listAssignees(taskId: string): Promise<string[]> {
  const { rows } = await pgPool.query(`select user_id from task_assignees where task_id = $1`, [taskId]);
  return rows.map((r: any) => r.user_id as string);
}

export async function assign(taskId: string, userId: string): Promise<void> {
  await pgPool.query(`insert into task_assignees (task_id, user_id) values ($1,$2) on conflict do nothing`, [taskId, userId]);
}

export async function unassign(taskId: string, userId: string): Promise<void> {
  await pgPool.query(`delete from task_assignees where task_id = $1 and user_id = $2`, [taskId, userId]);
}
