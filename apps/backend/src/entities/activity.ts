export interface ActivityLog {
  id: string;
  workspaceId?: string | null;
  projectId?: string | null;
  taskId?: string | null;
  actorId?: string | null;
  action: string;
  meta?: any;
  createdAt: string; // ISO
}
