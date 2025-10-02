export enum ProjectStatus {
  New = 0,
  InProgress = 1,
  Closed = 2,
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  status?: number | null; // ProjectStatus
  createdBy: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

// Project membership types aligned with database roles
export type ProjectRole = 'PROJECT_OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';

export interface ProjectMember {
  projectId: string;
  userId: string;
  role: ProjectRole;
  joinedAt: string; // ISO
}
