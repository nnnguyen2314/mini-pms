import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { listTaskActivity, listActivity } from '../controllers/activity.controller';

const router = Router();

router.use(authMiddleware);

// Get all activity logs with optional filters
router.get('/activity', listActivity);

// Get activity logs for a task
router.get('/tasks/:taskId/activity', listTaskActivity);

export default router;
