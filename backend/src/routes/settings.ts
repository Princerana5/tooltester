import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { env } from '../config/env.js';
const router = Router();
router.get('/', authMiddleware, (_req, res) => {
  res.json({ maxRequests: env.MAX_REQUESTS, maxConcurrency: env.MAX_CONCURRENCY, maxDurationSeconds: env.MAX_DURATION_SECONDS, requestTimeoutMs: env.REQUEST_TIMEOUT_MS, maxRedirects: env.MAX_REDIRECTS, blockPrivateTargets: env.BLOCK_PRIVATE_TARGETS });
});
router.put('/', authMiddleware, (req, res) => { res.json({ message: 'Settings are environment-driven', body: req.body }); });
export default router;
