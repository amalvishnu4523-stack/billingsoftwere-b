import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { listCategories, createCategory, updateCategory, deleteCategory } from '../controllers/category.controller.js';

const router = Router();

router.use(verifyToken);

router.get('/', listCategories);
router.post('/', requireRole('admin', 'manager'), createCategory);
router.put('/:id', requireRole('admin', 'manager'), updateCategory);
router.delete('/:id', requireRole('admin', 'manager'), deleteCategory);

export default router;
