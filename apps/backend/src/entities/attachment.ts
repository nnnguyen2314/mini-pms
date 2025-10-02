export interface TaskAttachment {
  id: string;
  taskId: string;
  uploaderId: string;
  filename: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  storageProvider?: string | null; // 'local' | 's3' | 'gcs' etc.
  url?: string | null; // public URL (if any)
  createdAt: string; // ISO
}
