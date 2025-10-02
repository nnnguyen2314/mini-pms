import { pgPool } from '../config/postgres.config';

export type EffectiveRole = 'ADMIN' | 'WORKSPACE_OWNER' | 'PROJECT_OWNER' | 'MEMBER' | 'GUEST';

// Legacy helper kept for existing callers that only need to know if user is ADMIN.
export async function getEffectiveRole(userId: string): Promise<'ADMIN' | 'MEMBER'> {
  const admin = await pgPool.query<{ exists: boolean }>(
    `select exists(select 1 from mini_pms.user_roles where user_id = $1 and role = 'ADMIN') as exists`,
    [userId]
  );
  return admin.rows?.[0]?.exists ? 'ADMIN' : 'MEMBER';
}

export async function getEffectiveRoles(userId: string): Promise<EffectiveRole[]> {
  const roles: Set<EffectiveRole> = new Set();

  // Global ADMIN
  const admin = await pgPool.query<{ exists: boolean }>(
    `select exists(select 1 from mini_pms.user_roles where user_id = $1 and role = 'ADMIN') as exists`,
    [userId]
  );
  if (admin.rows?.[0]?.exists) roles.add('ADMIN');

  // Workspace roles
  const ws = await pgPool.query<{ role: EffectiveRole }>(
    `select distinct role as role
       from mini_pms.workspace_members
      where user_id = $1 and role in ('WORKSPACE_OWNER','ADMIN','MEMBER','GUEST')`,
    [userId]
  );
  ws.rows.forEach(r => roles.add(r.role));

  // Project roles
  const pr = await pgPool.query<{ role: EffectiveRole }>(
    `select distinct role as role
       from mini_pms.project_members
      where user_id = $1 and role in ('PROJECT_OWNER','ADMIN','MEMBER','GUEST')`,
    [userId]
  );
  pr.rows.forEach(r => roles.add(r.role));

  // If no role found at all, return empty (caller may treat as guest)
  return Array.from(roles);
}

export async function getPermissionsForRoles(roles: EffectiveRole[]): Promise<string[]> {
  if (!roles?.length) return [];
  const { rows } = await pgPool.query<{ permission: string }>(
    `select distinct permission
       from mini_pms.role_permissions
      where role = any($1::text[])
      order by permission`,
    [roles]
  );
  return rows.map(r => r.permission);
}

// Backward compatibility: map a single role to permissions by delegating
export async function getPermissionsForRole(role: 'ADMIN' | 'OWNER' | 'MEMBER'): Promise<string[]> {
  // Map legacy OWNER to the union of PROJECT_OWNER and WORKSPACE_OWNER permissions
  const mapped: EffectiveRole[] = role === 'ADMIN'
    ? ['ADMIN']
    : role === 'OWNER'
      ? ['WORKSPACE_OWNER', 'PROJECT_OWNER']
      : ['MEMBER'];
  return getPermissionsForRoles(mapped);
}
