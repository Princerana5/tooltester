import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { authMiddleware } from '../middleware/auth.js';
const router = Router();
export interface Template { id: string; name: string; config: any; createdAt: string; }
const store = new Map<string, Template>();
const schema = z.object({ name: z.string().min(1), config: z.any() });
router.get('/', (_req, res) => res.json([...store.values()]));
router.get('/:id', (req, res) => { const t = store.get(req.params.id); if (!t) return res.status(404).json({ error: 'Not found' }); res.json(t); });
router.post('/', authMiddleware, (req, res) => {
  const p = schema.safeParse(req.body); if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const tpl: Template = { id: randomUUID(), name: p.data.name, config: p.data.config, createdAt: new Date().toISOString() };
  store.set(tpl.id, tpl); res.status(201).json(tpl);
});
router.put('/:id', authMiddleware, (req, res) => {
  const t = store.get(req.params.id); if (!t) return res.status(404).json({ error: 'Not found' });
  const p = schema.safeParse(req.body); if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const u = { ...t, name: p.data.name, config: p.data.config }; store.set(u.id, u); res.json(u);
});
router.delete('/:id', authMiddleware, (req, res) => {
  if (!store.has(req.params.id)) return res.status(404).json({ error: 'Not found' });
  store.delete(req.params.id); res.status(204).end();
});
export default router;
