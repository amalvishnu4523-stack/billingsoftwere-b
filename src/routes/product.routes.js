import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import {
  listProducts,
  searchProducts,
  getLowStock,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller.js';

const router = Router();

router.use(verifyToken);

router.get('/search', searchProducts);
router.get('/low-stock', getLowStock);
router.get('/', listProducts);
router.get('/:id', getProduct);
router.post('/', requireRole('admin', 'manager', 'inventory'), createProduct);
router.put('/:id', requireRole('admin', 'manager', 'inventory'), updateProduct);
router.delete('/:id', requireRole('admin'), deleteProduct);

export default router;
