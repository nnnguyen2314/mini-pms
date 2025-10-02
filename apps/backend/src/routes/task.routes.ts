import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { createTask, listProjectTasks, getTask, updateTask, deleteTask, listAssignees, assignUser, unassignUser } from '../controllers/task.controller';
import { upload } from '../controllers/attachment.controller';

const router = Router();

router.use(authMiddleware);

// Project scoped
router.post('/projects/:projectId/tasks', upload.any(), createTask);
router.get('/projects/:projectId/tasks', listProjectTasks);

// Task scoped
router.get('/tasks/:id', getTask);
router.patch('/tasks/:id', upload.any(), updateTask);
router.delete('/tasks/:id', deleteTask);

// Assignees
router.get('/tasks/:id/assignees', listAssignees);
router.post('/tasks/:id/assignees', assignUser);
router.delete('/tasks/:id/assignees/:userId', unassignUser);

export default router;
