import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { listUsers, createUser, updateUser, resetPassword, deleteUser } from '../controllers/user.controller.js';

const router = Router();

router.use(verifyToken, requireRole('admin'));

router.get('/', listUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.post('/:id/reset-password', resetPassword);
router.delete('/:id', deleteUser);

export default router;
