import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { authMiddleware } from '../middleware/auth.js';
import { db } from '../db.js';
const router = Router();
const createSchema = z.object({ url: z.string().url(), totalRequests: z.number().int().positive().optional().default(10), speedMode: z.string().optional(), concurrency: z.number().int().positive().optional() });
function csvEscape(v: any): string { const s = String(v ?? ''); if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"'; return s; }
router.post('/', authMiddleware, (req, res) => {
  const p = createSchema.safeParse(req.body); if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const run: any = { id: randomUUID(), status: 'running', createdAt: new Date().toISOString(), ...p.data };
  db.createRun(run); const io = (req.app as any).get('io'); if (io) io.emit('run:started', run);
  res.status(201).json(run);
});
router.get('/', (_req, res) => res.json(db.listRuns()));
router.get('/:id', (req, res) => { const r = db.getRun(req.params.id); if (!r) return res.status(404).json({ error: 'Run not found' }); res.json(r); });
router.get('/:id/clicks', (req, res) => { const r = db.getRun(req.params.id); if (!r) return res.status(404).json({ error: 'Run not found' }); res.json(db.getClicks(req.params.id)); });
router.delete('/:id', authMiddleware, (req, res) => { const r = db.getRun(req.params.id); if (!r) return res.status(404).json({ error: 'Run not found' }); db.deleteRun(req.params.id); res.status(204).end(); });
router.post('/:id/stop', authMiddleware, (req, res) => { const r: any = db.getRun(req.params.id); if (!r) return res.status(404).json({ error: 'Run not found' }); r.status = 'stopped'; res.json(r); });
router.post('/:id/duplicate', authMiddleware, (req, res) => { const r: any = db.getRun(req.params.id); if (!r) return res.status(404).json({ error: 'Run not found' }); const dup: any = { ...r, id: randomUUID(), status: 'queued', createdAt: new Date().toISOString() }; db.createRun(dup); res.status(201).json(dup); });
router.get('/:id/export/csv', (req, res) => { const r = db.getRun(req.params.id); if (!r) return res.status(404).json({ error: 'Run not found' }); const rows: any[] = db.getClicks(req.params.id); const cols = rows.length ? Object.keys(rows[0]) : ['id','status','url']; const csv = [cols.map(csvEscape).join(','), ...rows.map((x: any) => cols.map((c) => csvEscape(x[c])).join(','))].join('\n'); res.setHeader('Content-Type','text/csv'); res.setHeader('Content-Disposition','attachment; filename="run-' + req.params.id + '.csv"'); res.send(csv); });
router.get('/:id/export/json', (req, res) => { const r = db.getRun(req.params.id); if (!r) return res.status(404).json({ error: 'Run not found' }); res.setHeader('Content-Disposition','attachment; filename="run-' + req.params.id + '.json"'); res.json({ run: r, clicks: db.getClicks(req.params.id) }); });
export default router;
