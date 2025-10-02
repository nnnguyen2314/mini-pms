export interface Label {
  id: string;
  projectId: string;
  name: string;
  color?: string | null;
}

export interface TaskLabel {
  taskId: string;
  labelId: string;
}
