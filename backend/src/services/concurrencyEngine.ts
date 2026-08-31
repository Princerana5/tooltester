import { getDb } from '../db/index.js';
import { fireRequest } from './testEngine.js';
import { SOCKET_EVENTS } from '../config/constants.js';
import { uuid } from '../utils/random.js';
import { DEVICE_PROFILES } from '../data/devices.js';
import { LOCATION_PROFILES } from '../data/locations.js';
import { pick, shuffle } from '../utils/random.js';

const running = new Map<string, { stop: boolean }>();
export function isRunning(id: string) { return running.has(id); }
export function requestStop(id: string) { const r = running.get(id); if (r) r.stop = true; }

function buildPlans(run: any) {
  const total = run.total_requests;
  const sources: string[] = run.source_filter ? JSON.parse(run.source_filter) : ['sms', 'whatsapp', 'telegram', 'browser'];
  const geoCodes: string[] = run.geo_filter ? JSON.parse(run.geo_filter) : [];
  const locs = geoCodes.length ? LOCATION_PROFILES.filter(l => geoCodes.includes(l.countryCode)) : LOCATION_PROFILES;
  const devs: string[] = run.device_filter ? JSON.parse(run.device_filter) : [];
  const devices = devs.length ? DEVICE_PROFILES.filter(d => devs.includes(d.id)) : DEVICE_PROFILES;
  let sourcePool: string[] = [];
  if (run.scenario_id === 'source-attribution') {
    const per = Math.floor(total / 4); const rem = total - per * 4;
    sourcePool = [...Array(per).fill('sms'), ...Array(per).fill('whatsapp'), ...Array(per).fill('telegram'), ...Array(per).fill('browser')];
    for (let i = 0; i < rem; i++) sourcePool.push(pick(sources));
  } else {
    for (let i = 0; i < total; i++) sourcePool.push(pick(sources));
  }
  sourcePool = shuffle(sourcePool);
  return Array.from({ length: total }, (_, i) => ({ seq: i + 1, device: pick(devices), location: pick(locs), source: sourcePool[i]!, runId: run.id }));
}

function ensureColumns(db: any) {
  try {
    const cols = db.prepare("PRAGMA table_info(test_clicks)").all() as any[];
    const has = (n: string) => cols.some((c: any) => c.name === n);
    if (!has("final_url")) db.exec("ALTER TABLE test_clicks ADD COLUMN final_url TEXT");
    if (!has("redirects_json")) db.exec("ALTER TABLE test_clicks ADD COLUMN redirects_json TEXT");
  } catch {}
}

export async function runTest(runId: string, io: any) {
  const db = getDb();
  ensureColumns(db);
  const run = db.prepare('SELECT * FROM test_runs WHERE id=?').get(runId) as any;
  if (!run) return;
  const ctrl = { stop: false }; running.set(runId, ctrl);
  db.prepare("UPDATE test_runs SET status='running', started_at=? WHERE id=?").run(new Date().toISOString(), runId);
  io.to('run:' + runId).emit(SOCKET_EVENTS.started, { runId });
  const plans = buildPlans(run);
  let completed = 0, success = 0, fail = 0; const times: number[] = []; let idx = 0;
  async function worker() {
    while (true) {
      if (ctrl.stop) break;
      const myIdx = idx++; if (myIdx >= plans.length) break;
      const plan = plans[myIdx]!;
      const result: any = await fireRequest(run.target_url, plan, { followRedirects: true });
      if (ctrl.stop) break;
      const ok = result.status !== null && result.status < 400;
      if (ok) success++; else fail++;
      times.push(result.responseMs); completed++;
      try {
        db.prepare("INSERT INTO test_clicks (id,run_id,seq,device_id,device_name,os_version,browser,source,country,country_code,region,city,timezone,language,latitude,longitude,status,response_ms,redirect_url,final_url,redirects_json,error,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(uuid(), runId, plan.seq, plan.device.id, plan.device.name, plan.device.osVersion, plan.device.browser, plan.source, plan.location.country, plan.location.countryCode, plan.location.region, plan.location.city, plan.location.timezone, plan.location.language, plan.location.latitude, plan.location.longitude, result.status, result.responseMs, result.redirect, result.finalUrl || null, result.redirects ? JSON.stringify(result.redirects) : null, result.error, new Date().toISOString());
      } catch {
        db.prepare("INSERT INTO test_clicks (id,run_id,seq,device_id,device_name,os_version,browser,source,country,country_code,region,city,timezone,language,latitude,longitude,status,response_ms,redirect_url,error,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(uuid(), runId, plan.seq, plan.device.id, plan.device.name, plan.device.osVersion, plan.device.browser, plan.source, plan.location.country, plan.location.countryCode, plan.location.region, plan.location.city, plan.location.timezone, plan.location.language, plan.location.latitude, plan.location.longitude, result.status, result.responseMs, result.redirect, result.error, new Date().toISOString());
      }
      io.to('run:' + runId).emit(SOCKET_EVENTS.click, { seq: plan.seq, device: plan.device.name, os: plan.device.osVersion, browser: plan.device.browser, source: plan.source, country: plan.location.country, city: plan.location.city, status: result.status, responseMs: result.responseMs, error: result.error, finalUrl: result.finalUrl, redirects: result.redirects });
      io.to('run:' + runId).emit(SOCKET_EVENTS.progress, { completed, total: plans.length, success, fail, avgMs: Math.round(times.reduce((a, b) => a + b, 0) / times.length) });
    }
  }
  await Promise.all(Array.from({ length: Math.min(run.concurrency, plans.length) }, () => worker()));
  const avgMs = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;
  const finalStatus = ctrl.stop ? 'stopped' : 'completed';
  db.prepare("UPDATE test_runs SET status=?, finished_at=?, success_count=?, fail_count=?, avg_response_ms=? WHERE id=?").run(finalStatus, new Date().toISOString(), success, fail, avgMs, runId);
  running.delete(runId);
  io.to('run:' + runId).emit(SOCKET_EVENTS.finished, { runId, status: finalStatus, success, fail, avgMs });
}
