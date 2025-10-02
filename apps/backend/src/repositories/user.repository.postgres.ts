import { pgPool } from '../config/postgres.config';
import { User } from '../entities/user';
import { randomUUID } from 'crypto';

const TABLE = 'mini_pms.users';

export type ListUserOptions = {
  workspaceId?: string | null; // if null => no filter; if 'none' use noWorkspace flag instead
  noWorkspace?: boolean; // true to list users not in any workspace
  projectId?: string | null;
  sortBy?: 'name'|'email'|'created_at'|'updated_at'|'last_login'|'project_name'|'status';
  sortDir?: 'asc'|'desc';
  q?: string | null; // search by name/email
};

export async function listUsers(opts: ListUserOptions = {}): Promise<any[]> {
  const dir = (opts.sortDir === 'asc' ? 'asc' : 'desc');
  let orderCol = 'u.created_at';
  switch (opts.sortBy) {
    case 'name': orderCol = 'u.name'; break;
    case 'email': orderCol = 'u.email'; break;
    case 'created_at': orderCol = 'u.created_at'; break;
    case 'updated_at': orderCol = 'u.updated_at'; break;
    case 'last_login': orderCol = 'last_login'; break; // currently null for MVP
    case 'status': orderCol = 'u.status'; break;
    case 'project_name': orderCol = 'first_project_name'; break;
  }

  const params: any[] = [];
  let p = 0;

  let where = '1=1';
  if (opts.q) {
    params.push(`%${opts.q}%`); p++;
    where += ` and (u.name ilike $${p} or u.email ilike $${p})`;
  }
  let having = '';
  if (opts.noWorkspace) {
    having = ' having coalesce(count(distinct wm.workspace_id),0) = 0';
  } else if (opts.workspaceId) {
    params.push(opts.workspaceId); p++;
    where += ` and (wm.workspace_id = $${p})`;
  }
  if (opts.projectId) {
    params.push(opts.projectId); p++;
    where += ` and (pm.project_id = $${p})`;
  }

  const sql = `
    select u.id,
           u.name,
           u.email,
           u.status,
           u.created_at,
           u.updated_at,
           null::timestamptz as last_login,
           array_agg(distinct w.name) filter (where w.id is not null) as workspaces,
           array_agg(distinct p.name) filter (where p.id is not null) as projects,
           min(p.name) as first_project_name
      from ${TABLE} u
      left join mini_pms.workspace_members wm on wm.user_id = u.id
      left join mini_pms.workspaces w on w.id = wm.workspace_id
      left join mini_pms.project_members pm on pm.user_id = u.id
      left join mini_pms.projects p on p.id = pm.project_id
     where ${where}
     group by u.id
     ${having}
     order by ${orderCol} ${dir}, u.id asc`;

  const { rows } = await pgPool.query(sql, params);
  return rows;
}

export async function fetchUserData(userId: string): Promise<User | null> {
  const { rows } = await pgPool.query(
    `select id,
            name,
            email,
            status
       from ${TABLE}
      where id = $1`,
    [userId]
  );
  return rows[0] ?? null;
}

export async function updateUserData(userId: string, data: Partial<User>): Promise<void> {
  // Build dynamic update
  const fields: string[] = [];
  const values: any[] = [];
  let i = 1;

  const map: Record<string, string> = {
    name: 'name',
    email: 'email',
    status: 'status',
  } as const;

  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) continue;
    const col = (map as any)[k];
    if (!col) continue;
    fields.push(`${col} = $${++i}`);
    values.push(v);
  }

  if (fields.length === 0) return;

  const sql = `update ${TABLE} set ${fields.join(', ')}, updated_at = now() where id = $1`;
  await pgPool.query(sql, [userId, ...values]);
}

export async function inviteUser(email: string, name?: string | null): Promise<User> {
  // Minimal invite flow: create user with inactive status if not exists; if exists, return existing
  const existing = await pgPool.query(`select id, name, email, status from ${TABLE} where email = $1`, [email]);
  if (existing.rows?.[0]) {
    return existing.rows[0];
  }
  const id = randomUUID();
  const { rows } = await pgPool.query(
    `insert into ${TABLE} (id, name, email, status)
     values ($1, $2, $3, 0)
     returning id, name, email, status, created_at, updated_at`,
    [id, name ?? email.split('@')[0], email]
  );
  // TODO: send email using actual provider; for MVP log to console
  console.log('[invite] Sent invite email to', email, 'with userId', id);
  return rows[0];
}

export async function deactivateUser(userId: string): Promise<void> {
  await pgPool.query(`update ${TABLE} set status = 0, updated_at = now() where id = $1`, [userId]);
}
