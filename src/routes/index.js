import { Router } from 'express';
import authRoutes from './auth.routes.js';
import healthRoutes from './health.routes.js';
import productRoutes from './product.routes.js';
import saleRoutes from './sale.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import categoryRoutes from './category.routes.js';
import userRoutes from './user.routes.js';
import reportRoutes from './report.routes.js';
import settingsRoutes from './settings.routes.js';
import returnRoutes from './return.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/health', healthRoutes);
router.use('/products', productRoutes);
router.use('/sales', saleRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/categories', categoryRoutes);
router.use('/users', userRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingsRoutes);
router.use('/returns', returnRoutes);

export default router;
