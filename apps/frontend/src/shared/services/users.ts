import api from '@/shared/lib/api';
import type { Role } from '@/shared/types/auth';
import type { ListedUser } from '@/features/users/store/slice';
import type { UserStatus } from '@/features/users/store/slice';
import { codeToId, normalizeStatus } from '@/features/users/misc/status';

export interface UpdateUserPayload {
  id: string;
  name?: string;
  email?: string;
  roles?: Role[];
}

async function list(): Promise<ListedUser[]> {
  const { data } = await api.get('/users');
  return data;
}

async function updateStatus(userId: string, status: UserStatus | number | string): Promise<ListedUser> {
  // backend expects numeric enum; accept code or id here
  const id = typeof status === 'number' || /^\d+$/.test(String(status)) ? Number(status) : codeToId(normalizeStatus(status as any));
  const { data } = await api.patch(`/users/${userId}/status`, { status: id });
  return data;
}

async function update(payload: UpdateUserPayload): Promise<ListedUser> {
  const { id, ...rest } = payload;
  const { data } = await api.patch(`/users/${id}` , rest);
  return data;
}

async function addToWorkspaces(userId: string, workspaceIds: string[]): Promise<ListedUser> {
  const { data } = await api.post(`/users/${userId}/workspaces`, { workspaceIds });
  return data;
}

const usersService = { list, updateStatus, update, addToWorkspaces };
export default usersService;
