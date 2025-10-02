import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import * as ctrl from '../controllers/workspace.controller';

const router = Router();

router.use(authMiddleware);
router.get('/', ctrl.listMine);
router.post('/', ctrl.create);
router.get('/:id', ctrl.getById);
router.patch('/:id', ctrl.update);
router.delete('/:id', ctrl.destroy);

// Workspace membership management
router.post('/:id/members', ctrl.addMember);
router.post('/:id/invite', ctrl.inviteByEmail);
router.delete('/:id/members/:userId', ctrl.removeMember);

export default router;
