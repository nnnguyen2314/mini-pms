import { api } from '@/shared/lib/api';

export type WorkspaceStatus = 0 | 1 | 2 | null;
export interface Workspace {
  id: string;
  name: string;
  description?: string | null;
  status?: WorkspaceStatus;
  createdBy: string; // owner userId
  createdAt: string;
  updatedAt: string;
}

export interface ListResponse<T> { items: T[] }

function statusToName(status?: WorkspaceStatus): string {
  if (status === 1) return 'Active';
  if (status === 2) return 'Archived';
  if (status === 0) return 'Inactive';
  return 'Unknown';
}

async function list(params?: { name?: string; owner?: string; sortBy?: 'name'|'owner'|'createdAt'|'updatedAt'; sortDir?: 'asc'|'desc'; status?: WorkspaceStatus; }) {
  // Use the user-scoped listing; some deployments don't expose GET /workspaces for all
  // and only provide /me/workspaces (or alias). Try that first, then fall back.
  try {
    const { data } = await api.get<ListResponse<Workspace>>('/me/workspaces', { params });
    return data.items;
  } catch (_e: unknown) {
    // Fallback to /workspaces if /me/workspaces is not available
    const { data } = await api.get<ListResponse<Workspace>>('/workspaces', { params });
    return data.items;
  }
}

async function update(id: string, payload: Partial<Pick<Workspace,'name'|'description'|'status'>>) {
  const { data } = await api.patch<Workspace>(`/workspaces/${id}`, payload);
  return data;
}

async function addMember(id: string, userId: string, role: 'ADMIN'|'MEMBER'|'GUEST' = 'MEMBER') {
  await api.post(`/workspaces/${id}/members`, { userId, role });
}

export const workspacesService = { list, update, addMember, statusToName };
export default workspacesService;
