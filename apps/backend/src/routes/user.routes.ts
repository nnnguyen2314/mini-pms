import { Router } from 'express';
import { getUserData, updateUser, listUsers, inviteUser, deactivateUser, addUserToWorkspace, removeUserFromWorkspace, addUserToProject, removeUserFromProject } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Admin management
router.get('/', authMiddleware, listUsers);
router.post('/invite', authMiddleware, inviteUser);
router.delete('/:id', authMiddleware, deactivateUser);
router.post('/memberships/workspace', authMiddleware, addUserToWorkspace);
router.delete('/memberships/workspace', authMiddleware, removeUserFromWorkspace);
router.post('/memberships/project', authMiddleware, addUserToProject);
router.delete('/memberships/project', authMiddleware, removeUserFromProject);

// Self/user operations
router.get('/:id', authMiddleware, getUserData);
router.put('/:id', authMiddleware, updateUser);

export default router;