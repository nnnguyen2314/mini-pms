import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import * as repo from '../repositories/attachment.repository.postgres';
import { getS3Client, getS3Settings } from '../config/s3.config';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

function getUploadsDir(): string {
  // Store under repo/apps/backend/uploads
  return path.resolve(process.cwd(), 'apps', 'backend', 'uploads');
}

// Ensure uploads directory exists
function ensureUploadsDir() {
  const dir = getUploadsDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Configure multer storage based on provider
const settings = getS3Settings();
let upload: multer.Multer;
if (settings.provider === 's3') {
  // Memory storage; we'll stream buffer to S3 in controller
  upload = multer({ storage: multer.memoryStorage() });
} else {
  // Local disk storage
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      ensureUploadsDir();
      cb(null, getUploadsDir());
    },
    filename: (_req, file, cb) => {
      // Keep original name prefixed with timestamp
      const ts = Date.now();
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `${ts}-${safe}`);
    },
  });
  upload = multer({ storage });
}

export { upload };

export async function listForTask(req: any, res: Response): Promise<void> {
  const { taskId } = req.params;
  try {
    const items = await repo.listByTask(taskId);
    res.json({ items });
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to list attachments', error: String(e?.message || e) });
  }
}

export async function uploadForTask(req: any, res: Response): Promise<void> {
  const { taskId } = req.params;
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) {
    res.status(400).json({ message: 'file is required (multipart/form-data with field name "file")' });
    return;
  }
  try {
    const ts = Date.now();
    const safe = (file.originalname || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `${ts}-${safe}`;

    if (settings.provider === 's3') {
      const s3 = getS3Client();
      const bucket = settings.bucket!;
      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }));
      const publicUrl = settings.publicUrlBase
        ? `${settings.publicUrlBase.replace(/\/$/, '')}/${encodeURIComponent(key)}`
        : (settings.region && settings.bucket)
          ? `https://${settings.bucket}.s3.${settings.region}.amazonaws.com/${encodeURIComponent(key)}`
          : null;

      const att = await repo.createAttachment({
        taskId,
        uploaderId: req.userId,
        filename: key,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storageProvider: 's3',
        url: publicUrl,
      });
      res.status(201).json(att);
      return;
    }

    // Local storage branch
    const publicUrl = `/uploads/${(file as any).filename}`; // served by static route
    const att = await repo.createAttachment({
      taskId,
      uploaderId: req.userId,
      filename: (file as any).filename,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      storageProvider: 'local',
      url: publicUrl,
    });
    res.status(201).json(att);
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to upload attachment', error: String(e?.message || e) });
  }
}

export async function deleteOne(req: any, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const att = await repo.getById(id);
    if (!att) {
      res.status(404).json({ message: 'Attachment not found' });
      return;
    }

    if (att.storageProvider === 's3') {
      try {
        const s3 = getS3Client();
        const bucket = settings.bucket!;
        await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: att.filename }));
      } catch {
        // ignore S3 deletion errors
      }
    } else {
      const filePath = path.join(getUploadsDir(), att.filename);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch { /* ignore */ }
      }
    }

    await repo.deleteAttachment(id);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to delete attachment', error: String(e?.message || e) });
  }
}
