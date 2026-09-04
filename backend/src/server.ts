import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import path from 'node:path';
import { z } from 'zod';
import { env } from './config/env.js';
import { getDb } from './db/index.js';
import { authMiddleware } from './middleware/auth.js';
import { SOCKET_EVENTS, SPEED_PRESETS } from './config/constants.js';
import { DEVICE_PROFILES } from './data/devices.js';
import { LOCATION_PROFILES } from './data/locations.js';
import { runTest, requestStop } from './services/concurrencyEngine.js';
import { uuid } from './utils/random.js';
import { logger } from './utils/logger.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: env.corsOrigins, credentials: true } });

app.use(helmet());
app.use(cors({ origin: env.corsOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: env.RATE_LIMIT_WINDOW_MS, max: env.RATE_LIMIT_MAX, standardHeaders: true }));

// Auth removed: open access. Login endpoints kept as no-ops so old clients don't break.
app.post('/api/auth/login', (_req, res) => {
  res.json({ token: '', email: '' });
});
app.get('/api/auth/me', (_req, res) => res.json({ user: null }));
app.post('/api/auth/change-password', (_req, res) => res.status(410).json({ error: 'Auth removed: open access' }));

// Catalog
app.get('/api/devices', authMiddleware, (_req, res) => res.json(DEVICE_PROFILES));
app.get('/api/locations', authMiddleware, (_req, res) => res.json(LOCATION_PROFILES));
app.get('/api/sources', authMiddleware, (_req, res) => res.json(['sms','whatsapp','telegram','browser','other']));
app.get('/api/scenarios', authMiddleware, (_req, res) => res.json([
  { id:'android', label:'Android Test', desc:'100 Android clicks, random devices' },
  { id:'geo', label:'Geo Test', desc:'Distributed across locations' },
  { id:'source-attribution', label:'Source Attribution', desc:'25 each: SMS/WhatsApp/Telegram/Browser' },
  { id:'mixed', label:'Mixed Test', desc:'Random everything' },
  { id:'stress', label:'Stress Test', desc:'High volume + concurrency' },
  { id:'custom', label:'Custom', desc:'Manual configuration' },
]));

// Runs
const createRunSchema = z.object({
  targetUrl: z.string().url(),
  totalRequests: z.number().int().min(1).max(10000),
  concurrency: z.number().int().min(1).max(100).optional(),
  requestsPerSecond: z.number().int().min(1).max(1000).nullable().optional(),
  speedMode: z.enum(['sequential','fast','burst','custom']).default('sequential'),
  scenarioId: z.enum(['android','geo','source-attribution','mixed','stress','custom']).default('custom'),
  geoFilter: z.array(z.string()).optional(),
  sourceFilter: z.array(z.string()).optional(),
  deviceFilter: z.array(z.string()).optional(),
  osFilter: z.enum(['android','ios']).optional(),
  expected: z.any().optional(),
});

app.post('/api/runs', authMiddleware, (req, res) => {
  const parsed = createRunSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]!.message });
  const d = parsed.data;
  if (d.totalRequests > env.MAX_REQUESTS) return res.status(400).json({ error: `Max requests is ${env.MAX_REQUESTS}` });
  let concurrency = d.concurrency ?? SPEED_PRESETS[d.speedMode as keyof typeof SPEED_PRESETS]?.concurrency ?? 5;
  let rps = d.requestsPerSecond ?? (d.speedMode !== 'custom' ? (SPEED_PRESETS[d.speedMode as keyof typeof SPEED_PRESETS]?.requestsPerSecond ?? null) : null);
  concurrency = Math.min(concurrency, env.MAX_CONCURRENCY);
  const id = 'test_' + uuid().slice(0, 8);
  const db = getDb();
  // if osFilter given without deviceFilter, expand to all devices of that OS
  let deviceFilter = d.deviceFilter;
  if (!deviceFilter && (d as any).osFilter) {
    deviceFilter = DEVICE_PROFILES.filter(p => p.osName.toLowerCase() === (d as any).osFilter).map(p => p.id);
  }
  db.prepare("INSERT INTO test_runs (id,target_url,total_requests,concurrency,requests_per_second,speed_mode,scenario_id,status,created_at,expected_json,geo_filter,source_filter,device_filter) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)").run(id, d.targetUrl, d.totalRequests, concurrency, rps, d.speedMode, d.scenarioId, 'queued', new Date().toISOString(), d.expected?JSON.stringify(d.expected):null, d.geoFilter?JSON.stringify(d.geoFilter):null, d.sourceFilter?JSON.stringify(d.sourceFilter):null, deviceFilter?JSON.stringify(deviceFilter):null);
  const run = db.prepare('SELECT * FROM test_runs WHERE id=?').get(id);
  res.status(201).json(run);
  // start async
  setImmediate(() => runTest(id, io).catch(e=>logger.error('runTest failed',e)));
});

app.get('/api/runs', authMiddleware, (_req,res)=>{
  const db=getDb();
  res.json(db.prepare('SELECT * FROM test_runs ORDER BY created_at DESC').all());
});
app.get('/api/runs/:id', authMiddleware, (req,res)=>{
  const db=getDb();
  const run=db.prepare('SELECT * FROM test_runs WHERE id=?').get(req.params.id);
  if(!run) return res.status(404).json({error:'Not found'});
  res.json(run);
});
app.get('/api/runs/:id/clicks', authMiddleware, (req,res)=>{
  const db=getDb();
  res.json(db.prepare('SELECT * FROM test_clicks WHERE run_id=? ORDER BY seq ASC').all(req.params.id));
});
app.post('/api/runs/:id/stop', authMiddleware, (req,res)=>{
  requestStop(req.params.id);
  res.json({ ok:true });
});
app.delete('/api/runs/:id', authMiddleware, (req,res)=>{
  const db=getDb();
  db.prepare('DELETE FROM test_clicks WHERE run_id=?').run(req.params.id);
  db.prepare('DELETE FROM test_runs WHERE id=?').run(req.params.id);
  res.json({ ok:true });
});
app.post('/api/runs/:id/duplicate', authMiddleware, (req,res)=>{
  const db=getDb();
  const orig=db.prepare('SELECT * FROM test_runs WHERE id=?').get(req.params.id) as any;
  if(!orig) return res.status(404).json({error:'Not found'});
  const nid='test_'+uuid().slice(0,8);
  db.prepare("INSERT INTO test_runs (id,target_url,total_requests,concurrency,requests_per_second,speed_mode,scenario_id,status,created_at,expected_json,geo_filter,source_filter,device_filter) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)").run(nid, orig.target_url, orig.total_requests, orig.concurrency, orig.requests_per_second, orig.speed_mode, orig.scenario_id, 'queued', new Date().toISOString(), orig.expected_json, orig.geo_filter, orig.source_filter, orig.device_filter);
  res.json(db.prepare('SELECT * FROM test_runs WHERE id=?').get(nid));
});
app.get('/api/runs/:id/export/csv', authMiddleware, (req,res)=>{
  const db=getDb();
  const clicks=db.prepare('SELECT * FROM test_clicks WHERE run_id=? ORDER BY seq').all(req.params.id) as any[];
  const header='seq,device,os,browser,source,country,city,status,responseMs,error';
  const rows=clicks.map(c=>`${c.seq},"${c.device_name}",${c.os_version},${c.browser},${c.source},${c.country},${c.city},${c.status},${c.response_ms},"${(c.error||'').replace(/"/g,'""')}"`);
  res.setHeader('Content-Type','text/csv'); res.setHeader('Content-Disposition',`attachment; filename="${req.params.id}.csv"`); res.send([header,...rows].join('\n'));
});
app.get('/api/runs/:id/export/json', authMiddleware, (req,res)=>{
  const db=getDb();
  const run=db.prepare('SELECT * FROM test_runs WHERE id=?').get(req.params.id);
  const clicks=db.prepare('SELECT * FROM test_clicks WHERE run_id=? ORDER BY seq').all(req.params.id);
  res.setHeader('Content-Disposition',`attachment; filename="${req.params.id}.json"`); res.json({ run, clicks });
});
app.get('/api/stats', authMiddleware, (_req,res)=>{
  const db=getDb();
  const runs=db.prepare('SELECT * FROM test_runs').all() as any[];
  res.json({ totalRuns: runs.length, totalClicks: runs.reduce((a:number,r:any)=>a+r.success_count+r.fail_count,0), avgSuccess: runs.length?Math.round(runs.reduce((a:number,r:any)=>a+(r.success_count/(r.success_count+r.fail_count||1)),0)/runs.length*100):0 });
});

// Socket
io.on('connection', socket=>{
  socket.on(SOCKET_EVENTS.subscribe, (runId:string)=>{ socket.join('run:'+runId); });
  socket.on(SOCKET_EVENTS.unsubscribe, (runId:string)=>{ socket.leave('run:'+runId); });
});

// Serve frontend in production
if (env.isProd) {
  const fe = path.resolve(process.cwd(), '../frontend/dist');
  app.use(express.static(fe));
  app.get('*', (_req,res)=> res.sendFile(path.join(fe,'index.html')));
}

const port = env.PORT;
httpServer.listen(port, ()=> logger.info(`URL Tracker Lab backend on http://localhost:${port}`));
