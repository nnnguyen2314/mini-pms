import { pgPool } from '../config/postgres.config';
import { ActivityLog } from '../entities/activity';

function mapRow(r: any): ActivityLog {
  return {
    id: r.id,
    workspaceId: r.workspace_id ?? null,
    projectId: r.project_id ?? null,
    taskId: r.task_id ?? null,
    actorId: r.actor_id ?? null,
    action: r.action,
    meta: r.meta ?? null,
    createdAt: r.created_at?.toISOString?.() ?? r.created_at,
  };
}

export async function listForTask(
  taskId: string,
  options?: {
    limit?: number;
    before?: string | null;
    action?: string | null;
    actorId?: string | null;
    from?: string | null; // ISO start
    to?: string | null;   // ISO end
    order?: 'asc' | 'desc';
  }
): Promise<ActivityLog[]> {
  const limit = Math.min(Math.max(options?.limit ?? 20, 1), 100);
  const before = options?.before ?? null;
  const action = options?.action ?? null;
  const actorId = options?.actorId ?? null;
  const from = options?.from ?? null;
  const to = options?.to ?? null;
  const order = (options?.order === 'asc' ? 'asc' : 'desc');

  let sql = `select * from activity_logs where task_id = $1`;
  const params: any[] = [taskId];
  let p = 2;

  if (before) {
    sql += ` and created_at < $${p++}`;
    params.push(before);
  }
  if (from) {
    sql += ` and created_at >= $${p++}`;
    params.push(from);
  }
  if (to) {
    sql += ` and created_at <= $${p++}`;
    params.push(to);
  }
  if (action) {
    sql += ` and action = $${p++}`;
    params.push(action);
  }
  if (actorId) {
    sql += ` and actor_id = $${p++}`;
    params.push(actorId);
  }

  sql += ` order by created_at ${order} limit ${limit}`;

  const { rows } = await pgPool.query(sql, params);
  return rows.map(mapRow);
}


export async function list(options?: {
  limit?: number;
  before?: string | null;
  workspaceId?: string | null;
  projectId?: string | null;
  taskId?: string | null;
  action?: string | null;
  actorId?: string | null;
  from?: string | null; // ISO start
  to?: string | null;   // ISO end
  order?: 'asc' | 'desc';
}): Promise<ActivityLog[]> {
  const limit = Math.min(Math.max(options?.limit ?? 20, 1), 100);
  const before = options?.before ?? null;
  const workspaceId = options?.workspaceId ?? null;
  const projectId = options?.projectId ?? null;
  const taskId = options?.taskId ?? null;
  const action = options?.action ?? null;
  const actorId = options?.actorId ?? null;
  const from = options?.from ?? null;
  const to = options?.to ?? null;
  const order = (options?.order === 'asc' ? 'asc' : 'desc');

  let sql = `select * from activity_logs where 1=1`;
  const params: any[] = [];
  let p = 1;

  if (workspaceId) { sql += ` and workspace_id = $${p++}`; params.push(workspaceId); }
  if (projectId) { sql += ` and project_id = $${p++}`; params.push(projectId); }
  if (taskId) { sql += ` and task_id = $${p++}`; params.push(taskId); }
  if (before) { sql += ` and created_at < $${p++}`; params.push(before); }
  if (from) { sql += ` and created_at >= $${p++}`; params.push(from); }
  if (to) { sql += ` and created_at <= $${p++}`; params.push(to); }
  if (action) { sql += ` and action = $${p++}`; params.push(action); }
  if (actorId) { sql += ` and actor_id = $${p++}`; params.push(actorId); }

  sql += ` order by created_at ${order} limit ${limit}`;

  const { rows } = await pgPool.query(sql, params);
  return rows.map(mapRow);
}

export async function add(log: { workspaceId?: string | null; projectId?: string | null; taskId?: string | null; actorId?: string | null; action: string; meta?: any; }): Promise<ActivityLog> {
  const { rows } = await pgPool.query(
    `insert into activity_logs (workspace_id, project_id, task_id, actor_id, action, meta)
     values ($1,$2,$3,$4,$5,$6)
     returning *`,
    [log.workspaceId ?? null, log.projectId ?? null, log.taskId ?? null, log.actorId ?? null, log.action, log.meta ?? null]
  );
  return mapRow(rows[0]);
}

export async function recentWorkspaceIdsForUser(userId: string, limit: number = 10): Promise<{ id: string; lastActivityAt: string; }[]> {
  const { rows } = await pgPool.query(
    `select workspace_id as id, max(created_at) as last_activity_at
       from activity_logs
      where actor_id = $1 and workspace_id is not null
      group by workspace_id
      order by max(created_at) desc
      limit $2`,
    [userId, Math.min(Math.max(limit, 1), 50)]
  );
  return rows
    .filter((r: any) => r.id)
    .map((r: any) => ({ id: r.id, lastActivityAt: r.last_activity_at?.toISOString?.() ?? r.last_activity_at }));
}

export async function recentProjectIdsForUser(userId: string, limit: number = 10): Promise<{ id: string; lastActivityAt: string; }[]> {
  const { rows } = await pgPool.query(
    `select project_id as id, max(created_at) as last_activity_at
       from activity_logs
      where actor_id = $1 and project_id is not null
      group by project_id
      order by max(created_at) desc
      limit $2`,
    [userId, Math.min(Math.max(limit, 1), 50)]
  );
  return rows
    .filter((r: any) => r.id)
    .map((r: any) => ({ id: r.id, lastActivityAt: r.last_activity_at?.toISOString?.() ?? r.last_activity_at }));
}
