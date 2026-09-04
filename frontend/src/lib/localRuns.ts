import { DEVICE_FALLBACK } from "../data/devices";
import { LOCATION_FALLBACK } from "../data/locations";

export interface LocalRunConfig {
  targetUrl: string;
  totalRequests: number;
  concurrency?: number;
  speedMode?: string;
  scenarioId?: string;
  sources?: string[];
  deviceIds?: string[];
  countryCodes?: string[];
}

export interface LocalClick {
  id: string;
  seq: number;
  device: string;
  os: string;
  browser: string;
  source: string;
  country: string;
  city: string;
  status: number;
  responseMs: number;
  error: string | null;
}

export interface LocalRun {
  id: string;
  target_url: string;
  total_requests: number;
  concurrency: number;
  speed_mode: string;
  scenario_id: string;
  status: string;
  created_at: string;
  success_count: number;
  fail_count: number;
  avg_response_ms: number | null;
  clicks: LocalClick[];
}

const KEY = (id: string) => `local-run:${id}`;
const INDEX_KEY = "local-run:index";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function createLocalRun(cfg: LocalRunConfig): LocalRun {
  const id = "local_" + Math.random().toString(36).slice(2, 10);
  const run: LocalRun = {
    id,
    target_url: cfg.targetUrl,
    total_requests: cfg.totalRequests,
    concurrency: cfg.concurrency ?? 5,
    speed_mode: cfg.speedMode ?? "sequential",
    scenario_id: cfg.scenarioId ?? "custom",
    status: "running",
    created_at: new Date().toISOString(),
    success_count: 0,
    fail_count: 0,
    avg_response_ms: null,
    clicks: [],
  };
  // Pre-generate the plan (device/source/geo per click) so the feed looks realistic.
  const devices = cfg.deviceIds?.length
    ? DEVICE_FALLBACK.filter((d: any) => cfg.deviceIds!.includes(d.id))
    : DEVICE_FALLBACK;
  const locs = cfg.countryCodes?.length
    ? LOCATION_FALLBACK.filter((l: any) => cfg.countryCodes!.includes(l.countryCode))
    : LOCATION_FALLBACK;
  const sources = cfg.sources?.length ? cfg.sources : ["sms", "whatsapp", "telegram", "browser"];
  const pool = devices.length ? devices : DEVICE_FALLBACK;
  const geoPool = locs.length ? locs : LOCATION_FALLBACK;
  for (let seq = 1; seq <= run.total_requests; seq++) {
    const device: any = pick(pool);
    const loc: any = pick(geoPool);
    const ok = Math.random() > 0.06;
    const ms = 80 + Math.round(Math.random() * 700);
    run.clicks.push({
      id: `${id}-${seq}`,
      seq,
      device: device.name,
      os: `${device.osName} ${device.osVersion}`,
      browser: device.browser,
      source: pick(sources),
      country: loc.country,
      city: loc.city,
      status: ok ? 200 : pick([404, 500, 502, 0]),
      responseMs: ms,
      error: ok ? null : "simulated failure (demo mode — no backend)",
    });
  }
  saveLocalRun(run);
  try {
    const idx: string[] = JSON.parse(localStorage.getItem(INDEX_KEY) || "[]");
    idx.unshift(id);
    localStorage.setItem(INDEX_KEY, JSON.stringify(idx.slice(0, 50)));
  } catch {}
  return run;
}

export function saveLocalRun(run: LocalRun) {
  try { localStorage.setItem(KEY(run.id), JSON.stringify(run)); } catch {}
}

export function getLocalRun(id: string): LocalRun | null {
  try {
    const raw = localStorage.getItem(KEY(id));
    return raw ? (JSON.parse(raw) as LocalRun) : null;
  } catch { return null; }
}

export function listLocalRuns(): LocalRun[] {
  try {
    const idx: string[] = JSON.parse(localStorage.getItem(INDEX_KEY) || "[]");
    return idx.map(getLocalRun).filter(Boolean) as LocalRun[];
  } catch { return []; }
}

export function isLocalRunId(id: string | undefined): boolean {
  return !!id && id.startsWith("local_");
}
