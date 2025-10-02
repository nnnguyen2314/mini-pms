import { pgPool } from '../config/postgres.config';
import { Project } from '../entities/project';

function toStatusNumber(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  const n = parseInt(String(value), 10);
  return Number.isNaN(n) ? null : n;
}

function mapRow(r: any): Project {
  return {
    id: r.id,
    workspaceId: r.workspace_id,
    name: r.name,
    description: r.description ?? null,
    status: toStatusNumber(r.status),
    createdBy: r.created_by,
    createdAt: r.created_at?.toISOString?.() ?? r.created_at,
    updatedAt: r.updated_at?.toISOString?.() ?? r.updated_at,
  };
}

export async function createProject(workspaceId: string, creatorId: string, input: { name: string; description?: string | null; status?: number | null; }): Promise<Project> {
  const { rows } = await pgPool.query(
    `insert into projects (workspace_id, name, description, status, created_by)
     values ($1,$2,$3,$4,$5)
     returning *`,
    [workspaceId, input.name, input.description ?? null, input.status === undefined || input.status === null ? null : String(input.status), creatorId]
  );
  return mapRow(rows[0]);
}

export async function getById(id: string): Promise<Project | null> {
  const { rows } = await pgPool.query(`select * from projects where id = $1`, [id]);
  if (!rows?.length) return null;
  return mapRow(rows[0]);
}

export async function listByWorkspace(workspaceId: string, options?: { q?: string | null; limit?: number; before?: string | null; order?: 'asc' | 'desc'; }): Promise<Project[]> {
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 200);
  const q = options?.q ?? null;
  const before = options?.before ?? null;
  const order = (options?.order === 'asc' ? 'asc' : 'desc');

  let sql = `select * from projects where workspace_id = $1`;
  const params: any[] = [workspaceId];
  let p = 2;

  if (q) {
    sql += ` and (name ilike $${p} or coalesce(description,'') ilike $${p})`;
    params.push(`%${q}%`);
    p++;
  }
  if (before) {
    sql += ` and created_at < $${p++}`;
    params.push(before);
  }
  sql += ` order by created_at ${order} limit ${limit}`;

  const { rows } = await pgPool.query(sql, params);
  return rows.map(mapRow);
}

export async function updateProject(id: string, input: { name?: string | null; description?: string | null; status?: number | null; }): Promise<Project | null> {
  // Build dynamic update for fields
  const fields: string[] = [];
  const params: any[] = [];
  let p = 1;
  if (input.name !== undefined) { fields.push(`name = $${p++}`); params.push(input.name); }
  if (input.description !== undefined) { fields.push(`description = $${p++}`); params.push(input.description); }
  if (input.status !== undefined) { fields.push(`status = $${p++}`); params.push(input.status === null ? null : String(input.status)); }
  if (!fields.length) {
    // No changes; return current
    return await getById(id);
  }
  params.push(id);
  const { rows } = await pgPool.query(
    `update projects set ${fields.join(', ')} where id = $${p} returning *`,
    params
  );
  if (!rows?.length) return null;
  return mapRow(rows[0]);
}

export async function deleteProject(id: string): Promise<void> {
  await pgPool.query(`delete from projects where id = $1`, [id]);
}

export async function listByIds(ids: string[]): Promise<Project[]> {
  if (!ids?.length) return [];
  const { rows } = await pgPool.query(`select * from projects where id = any($1)`, [ids]);
  return rows.map(mapRow);
}

export async function addMember(projectId: string, userId: string, role: 'MEMBER'|'GUEST' = 'MEMBER'): Promise<void> {
  await pgPool.query(
    `insert into project_members (project_id, user_id, role) values ($1,$2,$3)
     on conflict (project_id, user_id) do update set role = excluded.role`,
    [projectId, userId, role]
  );
}

export async function removeMember(projectId: string, userId: string): Promise<void> {
  await pgPool.query(`delete from project_members where project_id = $1 and user_id = $2`, [projectId, userId]);
}

export async function getMemberRole(projectId: string, userId: string): Promise<'PROJECT_OWNER'|'ADMIN'|'MEMBER'|'GUEST'|null> {
  const { rows } = await pgPool.query(
    `select role from mini_pms.project_members where project_id = $1 and user_id = $2`,
    [projectId, userId]
  );
  return rows[0]?.role ?? null;
}

export async function listAccessibleForUser(userId: string, options?: { q?: string | null; limit?: number; before?: string | null; order?: 'asc' | 'desc'; }): Promise<Project[]> {
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 200);
  const q = options?.q ?? null;
  const before = options?.before ?? null;
  const order = (options?.order === 'asc' ? 'asc' : 'desc');

  let sql = `select p.* from projects p
              join workspace_members m on m.workspace_id = p.workspace_id and m.user_id = $1`;
  const params: any[] = [userId];
  let p = 2;

  if (q) { sql += ` where (p.name ilike $${p} or coalesce(p.description,'') ilike $${p})`; params.push(`%${q}%`); p++; }
  else { sql += ` where 1=1`; }
  if (before) { sql += ` and p.created_at < $${p++}`; params.push(before); }
  sql += ` order by p.created_at ${order} limit ${limit}`;

  const { rows } = await pgPool.query(sql, params);
  return rows.map(mapRow);
}
