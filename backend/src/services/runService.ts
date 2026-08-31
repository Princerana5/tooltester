import { db } from '../db.js';
import { uuid } from '../utils/random.js';

export function createRun(data: Record<string, unknown>): Record<string, unknown> {
  const run: Record<string, unknown> = {
    id: (data.id as string) ?? uuid(),
    url: data.url ?? data.targetUrl ?? '',
    status: 'queued',
    totalClicks: (data.totalClicks as number) ?? (data.totalRequests as number) ?? 10,
    completedClicks: 0,
    failedClicks: 0,
    concurrency: (data.concurrency as number) ?? 1,
    speedMode: (data.speedMode as string) ?? 'sequential',
    scenarioId: (data.scenarioId as string) ?? 'custom',
    source: (data.source as string) ?? null,
    deviceIds: (data.deviceIds as string[]) ?? [],
    locationIds: (data.locationIds as string[]) ?? [],
    createdAt: new Date().toISOString(),
    startedAt: null,
    finishedAt: null,
    error: null,
    meta: data.meta ?? null,
    ...data,
  };
  // ensure status queued
  run.status = 'queued';
  run.id = run.id as string;
  db.createRun(run as never);
  return run;
}

export function getRun(id: string): Record<string, unknown> | null {
  return (db.getRun(id) as unknown as Record<string, unknown>) ?? null;
}

export function listRuns(): Record<string, unknown>[] {
  return db.listRuns() as unknown as Record<string, unknown>[];
}

export function deleteRun(id: string): boolean {
  const existing = db.getRun(id);
  if (!existing) return false;
  db.deleteRun(id);
  return true;
}

export function duplicateRun(id: string): Record<string, unknown> | null {
  const orig = db.getRun(id) as unknown as Record<string, unknown> | null;
  if (!orig) return null;
  const copy = { ...orig, id: uuid(), status: 'queued', completedClicks: 0, failedClicks: 0, createdAt: new Date().toISOString(), startedAt: null, finishedAt: null, error: null };
  db.createRun(copy as never);
  return copy;
}
