import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';
import {
  setupController,
  loginController,
  refreshController,
  logoutController,
  meController,
} from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { setupSchema, loginSchema } from '../validation/auth.validation.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.isProduction ? 10 : 100,
  message: { success: false, message: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !config.isProduction,
});

router.post('/setup', authLimiter, validate(setupSchema), (req, res, next) => {
  if (config.isProduction) {
    res.status(403).json({ success: false, message: 'Setup is disabled' });
    return;
  }
  setupController(req, res, next);
});
router.post('/login', authLimiter, validate(loginSchema), loginController);
router.post('/refresh', refreshController);
router.post('/logout', logoutController);
router.get('/me', verifyToken, meController);

export default router;
