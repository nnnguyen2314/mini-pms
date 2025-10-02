import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { getMe, getMyRecentWorkspaces, getMyRecentProjects, listMyProjects } from '../controllers/me.controller';

const router = Router();

router.get('/', authMiddleware, getMe);
router.get('/recent/workspaces', authMiddleware, getMyRecentWorkspaces);
router.get('/recent/projects', authMiddleware, getMyRecentProjects);
router.get('/projects', authMiddleware, listMyProjects);

export default router;
