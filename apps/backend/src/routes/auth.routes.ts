import { Router } from 'express';
import { login, me, refresh, logout } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { mePermissions } from '../controllers/permission.controller';
import { createRateLimiter, requireSameOrigin } from '../middlewares/security.middleware';

const router = Router();

const loginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 20 });
const refreshLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 60 });

// Cast to any to satisfy Express v5 typings in this project configuration
router.post('/auth/login', loginLimiter as any, login as any);
router.post('/auth/refresh', requireSameOrigin as any, refreshLimiter as any, refresh as any);
router.post('/auth/logout', requireSameOrigin as any, logout as any);
router.get('/auth/me', authMiddleware as any, me as any);
router.get('/auth/permissions', ...(mePermissions as any));

export default router;
