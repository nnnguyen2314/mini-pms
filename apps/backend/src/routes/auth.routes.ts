import { Router } from 'express';
import { login, me } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { mePermissions } from '../controllers/permission.controller';

const router = Router();

// Cast to any to satisfy Express v5 typings in this project configuration
router.post('/auth/login', login as any);
router.get('/auth/me', authMiddleware as any, me as any);
router.get('/auth/permissions', ...(mePermissions as any));

export default router;
