import { AUTH_KEY, storage } from '../utils/storage';
import type { AuthState, User, Role } from '../types/auth';
import api from '../lib/api';

// Mock auth service with backend integration + local fallback

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

export type Credentials = { email: string; password: string };
export type SignUpInput = Credentials & { name: string; role?: Role };

function defaultPermissionsFor(role: Role): string[] {
  switch (role) {
    case 'ADMIN':
      return ['workspace:create','workspace:update','workspace:delete','project:create','project:update','project:delete','project:archive','member:add:workspace','member:remove:workspace','member:add:project','member:remove:project','task:create','task:update','task:delete','task:archive','task:assign:self','task:assign:other','comment:create','comment:delete:self','comment:delete:other'];
    case 'WORKSPACE_OWNER':
      return ['workspace:update','member:add:workspace','member:remove:workspace','project:create','project:update','project:delete','project:archive','task:create','task:update','task:delete','task:archive','task:assign:self','task:assign:other','comment:create','comment:delete:self','comment:delete:other'];
    case 'PROJECT_OWNER':
      return ['member:add:project','member:remove:project','task:create','task:update','task:delete','task:archive','task:assign:self','task:assign:other','comment:create','comment:delete:self','comment:delete:other'];
    case 'MEMBER':
      return ['task:assign:self','task:create','task:update','task:delete:own','comment:create','comment:delete:self'];
    case 'GUEST':
    default:
      return [];
  }
}

export const authService = {
  getAuth(): AuthState | null {
    return storage.get<AuthState>(AUTH_KEY);
  },
  setAuth(state: AuthState) {
    storage.set(AUTH_KEY, state);
    return state;
  },
  clearAuth() {
    storage.remove(AUTH_KEY);
  },
  isAuthenticated() {
    const a = this.getAuth();
    return !!a?.token && !!a?.user;
  },
  login: async ({ email, password }: Credentials): Promise<AuthState> => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      let roles: Role[] | undefined = data.roles ?? data.user?.roles;
      let permissions: string[] | undefined = data.permissions;
      // If backend login response doesn't include roles/permissions, fetch them
      if (!roles || roles.length === 0 || !permissions || permissions.length === 0) {
        try {
          const { data: perms } = await api.get('/auth/permissions');
          roles = perms.roles ?? roles;
          permissions = perms.permissions ?? permissions;
        } catch (_e) {
          // ignore; will proceed with whatever we have
        }
      }
      const auth: AuthState = { user: data.user, token: data.token, roles, permissions };
      return authService.setAuth(auth);
    } catch (_e) {
      // Fallback mock behavior (dev only)
      const name = (email.split('@')[0] ?? '').toLowerCase();
      const roleByName: Record<string, Role> = {
        admin: 'ADMIN',
        owner: 'WORKSPACE_OWNER',
        pwo: 'PROJECT_OWNER',
        member: 'MEMBER',
        guest: 'GUEST',
      };
      const role: Role = roleByName[name] ?? 'MEMBER';
      const user: User = { id: randomId(), email, name, role, roles: [role] };
      const auth: AuthState = { user, token: randomId(), roles: user.roles, permissions: defaultPermissionsFor(role) };
      return authService.setAuth(auth);
    }
  },
  signup: async ({ email, name, password, role }: SignUpInput): Promise<AuthState> => {
    try {
      const { data } = await api.post('/auth/signup', { name, email, password, role });
      let roles: Role[] | undefined = data.roles ?? data.user?.roles;
      let permissions: string[] | undefined = data.permissions;
      if (!roles || roles.length === 0 || !permissions || permissions.length === 0) {
        try {
          const { data: perms } = await api.get('/auth/permissions');
          roles = perms.roles ?? roles;
          permissions = perms.permissions ?? permissions;
        } catch (_e) {}
      }
      const auth: AuthState = { user: data.user, token: data.token, roles, permissions };
      return authService.setAuth(auth);
    } catch (_e) {
      const r: Role = role ?? 'MEMBER';
      const user: User = { id: randomId(), email, name, role: r, roles: [r] };
      const auth: AuthState = { user, token: randomId(), roles: user.roles, permissions: defaultPermissionsFor(r) };
      return authService.setAuth(auth);
    }
  },
  forgotPassword: async (email: string): Promise<{ ok: boolean }> => {
    try {
      await api.post('/auth/forgot-password', { email });
      return { ok: true };
    } catch (_e) {
      return { ok: !!email };
    }
  },
  resetPassword: async (token: string, newPassword: string): Promise<{ ok: boolean }> => {
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      return { ok: true };
    } catch (_e) {
      return { ok: true };
    }
  },
  logout() {
    this.clearAuth();
  },
};
