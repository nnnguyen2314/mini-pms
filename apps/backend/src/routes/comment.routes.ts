import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { listForTask } from '../controllers/comment.controller';

const router = Router();

router.use(authMiddleware);

// List comments for a task
router.get('/tasks/:taskId/comments', listForTask);

export default router;
