import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';
let db: Database.Database;
export function getDb() {
  if (db) return db;
  fs.mkdirSync(path.dirname(env.dbPath), { recursive: true });
  db = new Database(env.dbPath);
  db.pragma('journal_mode=WAL');
  migrate(db);
  return db;
}
function migrate(d: Database.Database) {
  d.exec(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL)`);
  d.exec(`CREATE TABLE IF NOT EXISTS test_runs (id TEXT PRIMARY KEY, target_url TEXT NOT NULL, total_requests INTEGER NOT NULL, concurrency INTEGER NOT NULL, requests_per_second INTEGER, speed_mode TEXT NOT NULL, scenario_id TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL, started_at TEXT, finished_at TEXT, success_count INTEGER NOT NULL DEFAULT 0, fail_count INTEGER NOT NULL DEFAULT 0, avg_response_ms INTEGER, expected_json TEXT, verification_json TEXT, geo_filter TEXT, source_filter TEXT, device_filter TEXT)`);
  d.exec(`CREATE TABLE IF NOT EXISTS test_clicks (id TEXT PRIMARY KEY, run_id TEXT NOT NULL, seq INTEGER NOT NULL, device_id TEXT NOT NULL, device_name TEXT NOT NULL, os_version TEXT NOT NULL, browser TEXT NOT NULL, source TEXT NOT NULL, country TEXT NOT NULL, country_code TEXT NOT NULL, region TEXT NOT NULL, city TEXT NOT NULL, timezone TEXT NOT NULL, language TEXT NOT NULL, latitude REAL NOT NULL, longitude REAL NOT NULL, status INTEGER, response_ms INTEGER, redirect_url TEXT, error TEXT, created_at TEXT NOT NULL)`);
  d.exec(`CREATE INDEX IF NOT EXISTS idx_clicks_run ON test_clicks(run_id)`);
  d.exec(`CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, action TEXT NOT NULL, detail TEXT, created_at TEXT NOT NULL)`);
  // add columns if missing
  const cols = d.prepare("PRAGMA table_info(test_clicks)").all() as any[];
  const has = (n: string) => cols.some((c: any) => c.name === n);
  if (!has("final_url")) { try { d.exec("ALTER TABLE test_clicks ADD COLUMN final_url TEXT"); } catch {} }
  if (!has("redirects_json")) { try { d.exec("ALTER TABLE test_clicks ADD COLUMN redirects_json TEXT"); } catch {} }
}
