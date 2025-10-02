export interface Notification {
  id: string;
  userId: string;
  type: string; // e.g., task_assigned, comment_mention, team_invite
  title?: string | null;
  body?: string | null;
  entityType?: string | null; // task | project | workspace | comment | team
  entityId?: string | null;   // store as text for flexibility
  meta?: any;
  isRead: boolean;
  createdAt: string; // ISO
}
