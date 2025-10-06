import { api } from '@/shared/lib/api';

export type ProjectStatus = 0 | 1 | 2 | null; // 0: Inactive, 1: Active, 2: Archived
export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status?: ProjectStatus;
  createdBy: string; // owner userId
  workspaceId?: string | null;
  workspaceName?: string | null; // optional convenience
  createdAt: string;
  updatedAt: string;
}

export interface ListResponse<T> { items: T[] }

export function statusToName(status?: ProjectStatus): string {
  if (status === 1) return 'Active';
  if (status === 2) return 'Archived';
  if (status === 0) return 'Inactive';
  return 'Unknown';
}

// NOTE:
// Backend does not expose GET /api/projects for listing.
// Use /api/me/projects for the authenticated user's accessible projects,
// or /api/workspaces/:workspaceId/projects for a specific workspace.
async function list(params?: { name?: string; owner?: string; workspace?: string; sortBy?: 'name'|'owner'|'createdAt'|'updatedAt'|'workspace'; sortDir?: 'asc'|'desc'; status?: ProjectStatus; }) {
  const { data } = await api.get<ListResponse<Project>>('/me/projects', { params });
  return data.items;
}

// Creating a project is workspace-scoped in the backend
async function create(payload: Partial<Pick<Project,'name'|'description'|'status'|'workspaceId'|'createdBy'>>) {
  const { workspaceId, ...rest } = payload || {} as any;
  if (!workspaceId) throw new Error('workspaceId is required to create a project');
  const { data } = await api.post<Project>(`/workspaces/${workspaceId}/projects`, rest);
  return data;
}

async function update(id: string, payload: Partial<Pick<Project,'name'|'description'|'status'|'workspaceId'|'createdBy'>>) {
  const { data } = await api.patch<Project>(`/projects/${id}`, payload);
  return data;
}

export const projectsService = { list, create, update, statusToName };
export default projectsService;
