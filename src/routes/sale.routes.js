import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { createSale, listSales, getSale, cancelSale } from '../controllers/sale.controller.js';

const router = Router();

router.use(verifyToken);

router.post('/', requireRole('admin', 'manager', 'sales'), createSale);
router.get('/', requireRole('admin', 'manager', 'sales'), listSales);
router.get('/:id', requireRole('admin', 'manager', 'sales'), getSale);
router.post('/:id/cancel', requireRole('admin', 'manager'), cancelSale);

export default router;
