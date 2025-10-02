export type Role = 'ADMIN' | 'WORKSPACE_OWNER' | 'PROJECT_OWNER' | 'MEMBER' | 'GUEST';

export interface User {
  id: string;
  email: string;
  name: string;
  // Primary/effective role (optional if roles[] provided)
  role?: Role;
  roles?: Role[];
  avatarUrl?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  roles?: Role[]; // convenient duplication at root from backend
  permissions?: string[]; // flat list of granted permissions from backend
}
