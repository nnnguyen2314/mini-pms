export enum TaskStatus {
  ToDo = 0,
  InProgress = 1,
  InReview = 2,
  Done = 3,
  Closed = 4,
  OnHold = 5,
}

export interface Task {
  id: string;
  projectId: string;
  boardId: string;
  columnId: string | null;
  title: string;
  description?: string | null;
  status?: number | null; // TaskStatus
  priority?: string | null;
  dueDate?: string | null; // YYYY-MM-DD
  createdBy: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface TaskAssignee {
  taskId: string;
  userId: string;
}
