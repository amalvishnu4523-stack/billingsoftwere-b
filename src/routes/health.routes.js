import { Router } from 'express';
import { config } from '../config/env.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

export default router;
