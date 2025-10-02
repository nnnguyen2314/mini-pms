export enum WorkspaceStatus {
  Inactive = 0,
  Active = 1,
  Archived = 2,
}

export interface Workspace {
  id: string;
  name: string;
  description?: string | null;
  status?: number | null; // WorkspaceStatus
  createdBy: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export type WorkspaceRole = 'WORKSPACE_OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';

export interface WorkspaceMember {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  joinedAt: string; // ISO
}
