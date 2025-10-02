import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { listForTask, uploadForTask, deleteOne, upload } from '../controllers/attachment.controller';

const router = Router();

router.use(authMiddleware);

// List attachments for a task
router.get('/tasks/:taskId/attachments', listForTask);

// Upload an attachment for a task (multipart/form-data; field name: "file")
router.post('/tasks/:taskId/attachments', upload.single('file'), uploadForTask);

// Delete attachment by id (optionally pass { filename } in body for file removal)
router.delete('/attachments/:id', deleteOne);

export default router;
