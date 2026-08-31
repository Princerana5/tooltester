import crypto from 'node:crypto';

export function pick<T>(arr: readonly T[]): T {
  if (arr.length === 0) throw new Error('pick() called with an empty array');
  return arr[crypto.randomInt(arr.length)]!;
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export function randomInt(min: number, max: number): number {
  if (max <= min) return min;
  return min + crypto.randomInt(max - min + 1);
}

export function shortId(bytes = 6): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function uuid(): string {
  return crypto.randomUUID();
}

/**
 * Distribute `total` items across `weights` keys, preserving the exact total.
 * Largest-remainder method, so 100 across 4 equal keys is exactly 25/25/25/25.
 */
export function distribute<K extends string>(
  total: number,
  weights: Record<K, number>,
): Record<K, number> {
  const keys = Object.keys(weights) as K[];
  const sum = keys.reduce((acc, k) => acc + Math.max(0, weights[k]), 0);
  const out = {} as Record<K, number>;
  if (keys.length === 0 || sum <= 0 || total <= 0) {
    for (const k of keys) out[k] = 0;
    return out;
  }

  const remainders: Array<{ key: K; rem: number }> = [];
  let assigned = 0;
  for (const k of keys) {
    const exact = (total * Math.max(0, weights[k])) / sum;
    const base = Math.floor(exact);
    out[k] = base;
    assigned += base;
    remainders.push({ key: k, rem: exact - base });
  }

  remainders.sort((a, b) => b.rem - a.rem);
  let i = 0;
  while (assigned < total && remainders.length > 0) {
    out[remainders[i % remainders.length]!.key] += 1;
    assigned += 1;
    i += 1;
  }
  return out;
}

/** Build a flat list from a count map: {a:2,b:1} -> ['a','a','b'] */
export function expandCounts<K extends string>(counts: Record<K, number>): K[] {
  const out: K[] = [];
  for (const [k, n] of Object.entries(counts) as Array<[K, number]>) {
    for (let i = 0; i < n; i++) out.push(k);
  }
  return out;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx]!;
}
