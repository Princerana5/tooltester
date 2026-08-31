import 'dotenv/config';
import path from 'node:path';
import { z } from 'zod';

const bool = (def: boolean) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? def : v.toLowerCase() === 'true'));

const int = (def: number) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? def : Number(v)))
    .pipe(z.number().int().positive());

const schema = z.object({
  PORT: int(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  DB_PATH: z.string().default('./data/url-tracker-lab.db'),

  ADMIN_EMAIL: z.string().min(1).default('admin@local'),
  ADMIN_PASSWORD: z.string().min(8).default('changeme-admin-password'),
  JWT_SECRET: z.string().min(16).default('dev-only-secret-change-me-please'),
  JWT_EXPIRES_IN: z.string().default('12h'),
  API_KEY: z.string().optional().default(''),

  MAX_REQUESTS: int(10000),
  MAX_CONCURRENCY: int(100),
  MAX_DURATION_SECONDS: int(60),
  REQUEST_TIMEOUT_MS: int(15000),
  MAX_REDIRECTS: z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? 5 : Number(v)))
    .pipe(z.number().int().min(0).max(20)),

  RATE_LIMIT_WINDOW_MS: int(60000),
  RATE_LIMIT_MAX: int(300),

  TEST_HEADER_PREFIX: z.string().default('X-URL-Tracker-Test'),
  TEST_USER_AGENT_SUFFIX: z.string().default('URLTrackerLab/1.0 (+synthetic-test-traffic)'),

  BLOCK_PRIVATE_TARGETS: bool(false),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => '  - ' + (i.path.join('.') || '(root)') + ': ' + i.message)
    .join('\n');
  console.error('Invalid environment configuration:\n' + issues);
  console.error('\nCopy .env.example to .env and fill it in.');
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProd: raw.NODE_ENV === 'production',
  isTest: raw.NODE_ENV === 'test',
  dbPath: path.resolve(process.cwd(), raw.DB_PATH),
  corsOrigins: raw.CORS_ORIGIN.split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  apiKey: raw.API_KEY.trim(),
};

export type Env = typeof env;
