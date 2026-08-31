import type { RunStatus, SourceType } from '../config/constants.js';

export interface DeviceProfile {
  id: string;
  name: string;
  brand: string;
  model: string;
  osName: string;
  osVersion: string;
  browser: string;
  browserVersion: string;
  screen: { width: number; height: number };
  userAgent: string;
  language: string;
  timezone: string;
}

export interface LocationProfile {
  id: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  timezone: string;
  language: string;
  latitude: number;
  longitude: number;
  synthetic: true;
}

export interface TestRun {
  id: string;
  url: string;
  status: RunStatus;
  scenarioId: string;
  source: SourceType | null;
  totalClicks: number;
  completedClicks: number;
  failedClicks: number;
  concurrency: number;
  speedMode: string;
  deviceIds: string[];
  locationIds: string[];
  countryCodes: string[];
  createdBy: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
  meta: Record<string, unknown> | null;
}

export interface TestClick {
  id: string;
  runId: string;
  index: number;
  url: string;
  deviceId: string | null;
  locationId: string | null;
  source: SourceType | null;
  statusCode: number | null;
  latencyMs: number | null;
  error: string | null;
  redirected: boolean;
  finalUrl: string | null;
  createdAt: string;
}
