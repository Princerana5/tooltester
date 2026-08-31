// Minimal in-memory DB stub — replace with better-sqlite3 when ready
export interface Run { id: string; url: string; status: string; createdAt: string; [k:string]: any; }
const runs = new Map<string, Run>();
const clicks = new Map<string, any[]>();
export const db = {
  runs, clicks,
  // helper for routes
  getRun(id: string) { return runs.get(id) ?? null; },
  listRuns() { return [...runs.values()]; },
  createRun(r: Run) { runs.set(r.id, r); clicks.set(r.id, []); return r; },
  deleteRun(id: string) { runs.delete(id); clicks.delete(id); },
  getClicks(runId: string) { return clicks.get(runId) ?? []; },
  addClick(runId: string, c: any) { (clicks.get(runId) ?? []).push(c); },
};
export default db;
