import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { listForWorkspace, create, getById, update, remove } from '../controllers/project.controller';

const router = Router();

router.use(authMiddleware);

// List/create projects within a workspace
router.get('/workspaces/:workspaceId/projects', listForWorkspace);
router.post('/workspaces/:workspaceId/projects', create);

// Single project operations
router.get('/projects/:id', getById);
router.patch('/projects/:id', update);
router.delete('/projects/:id', remove);

// Project membership management
import { addMember, removeMember } from '../controllers/project.controller';
router.post('/projects/:id/members', addMember);
router.delete('/projects/:id/members/:userId', removeMember);

export default router;
