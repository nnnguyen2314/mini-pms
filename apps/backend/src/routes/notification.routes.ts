import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { listMyNotifications, createNotification, markOneRead, markAllMyRead } from '../controllers/notification.controller';

const router = Router();

router.use(authMiddleware);

// List current user's notifications
router.get('/notifications', listMyNotifications);

// Create a notification (system/admin)
router.post('/notifications', createNotification);

// Mark one notification as read
router.post('/notifications/:id/read', markOneRead);

// Mark all current user's notifications as read
router.post('/notifications/read-all', markAllMyRead);

export default router;
