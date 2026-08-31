/** Shared constants for the test engine and API surface. */

export const RUN_STATUS = ['queued', 'running', 'completed', 'stopped', 'failed'] as const;
export type RunStatus = (typeof RUN_STATUS)[number];

export const SPEED_MODES = ['sequential', 'fast', 'burst', 'custom'] as const;
export type SpeedMode = (typeof SPEED_MODES)[number];

export const SOURCE_TYPES = ['sms', 'whatsapp', 'telegram', 'browser', 'other'] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const SCENARIO_IDS = [
  'android',
  'geo',
  'source-attribution',
  'mixed',
  'stress',
  'custom',
] as const;
export type ScenarioId = (typeof SCENARIO_IDS)[number];

export const VERIFICATION_STATUS = ['pass', 'warning', 'fail', 'skipped'] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUS)[number];

/** Default concurrency + pacing per speed mode. */
export const SPEED_PRESETS: Record<
  Exclude<SpeedMode, 'custom'>,
  { concurrency: number; requestsPerSecond: number | null }
> = {
  sequential: { concurrency: 1, requestsPerSecond: 2 },
  fast: { concurrency: 10, requestsPerSecond: 25 },
  burst: { concurrency: 50, requestsPerSecond: null },
};

/** Socket.IO event names, shared with the frontend. */
export const SOCKET_EVENTS = {
  subscribe: 'run:subscribe',
  unsubscribe: 'run:unsubscribe',
  started: 'run:started',
  progress: 'run:progress',
  click: 'run:click',
  finished: 'run:finished',
  error: 'run:error',
} as const;

/** Query parameter names appended to every synthetic request. */
export const TEST_QUERY_PARAMS = {
  testMode: 'test_mode',
  runId: 'test_run_id',
  clickId: 'test_click_id',
  source: 'test_source',
  device: 'test_device',
  geoMode: 'geo_mode',
  country: 'test_country',
  region: 'test_region',
  city: 'test_city',
  timezone: 'test_timezone',
  language: 'test_language',
  lat: 'test_lat',
  lon: 'test_lon',
} as const;
