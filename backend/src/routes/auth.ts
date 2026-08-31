import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, password } = parsed.data;
  if (email !== env.ADMIN_EMAIL || password !== env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ sub: 'admin', email, role: 'admin' }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as any);
  res.json({ token, user: { id: 'admin', email, role: 'admin' } });
});
router.post('/api-key', authMiddleware, (_req, res) => {
  if (!env.apiKey) return res.status(404).json({ error: 'API key auth not configured' });
  res.json({ configured: true, hint: '***' + env.apiKey.slice(-4) });
});
router.get('/me', authMiddleware, (req, res) => { res.json({ user: (req as any).user }); });
export default router;
