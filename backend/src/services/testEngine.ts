import { env } from '../config/env.js';
import { TEST_QUERY_PARAMS } from '../config/constants.js';
export interface ClickPlan { seq: number; device: any; location: any; source: string; runId: string; }

function appendTestParams(targetUrl: string, plan: ClickPlan): string {
  const u = new URL(targetUrl);
  const p: Record<string, string> = {
    [TEST_QUERY_PARAMS.testMode]: 'true',
    [TEST_QUERY_PARAMS.runId]: plan.runId,
    [TEST_QUERY_PARAMS.clickId]: String(plan.seq),
    [TEST_QUERY_PARAMS.source]: plan.source,
    [TEST_QUERY_PARAMS.device]: plan.device.id,
    [TEST_QUERY_PARAMS.geoMode]: 'simulated',
    [TEST_QUERY_PARAMS.country]: plan.location.countryCode,
    [TEST_QUERY_PARAMS.region]: plan.location.region,
    [TEST_QUERY_PARAMS.city]: plan.location.city,
    [TEST_QUERY_PARAMS.timezone]: plan.location.timezone,
    [TEST_QUERY_PARAMS.language]: plan.location.language,
    [TEST_QUERY_PARAMS.lat]: String(plan.location.latitude),
    [TEST_QUERY_PARAMS.lon]: String(plan.location.longitude),
  };
  for (const [k, v] of Object.entries(p)) u.searchParams.set(k, v);
  return u.toString();
}

export function buildHeaders(plan: ClickPlan): Record<string, string> {
  return {
    'User-Agent': plan.device.userAgent + ' ' + env.TEST_USER_AGENT_SUFFIX,
    'Accept-Language': plan.location.language + ',en;q=0.8',
    'X-URL-Tracker-Test': 'true',
    'X-Test-Run-ID': plan.runId,
    'X-Test-Click-ID': String(plan.seq),
    'X-Test-Source': plan.source,
    'X-Test-Device': plan.device.id,
    'X-Test-Geo': plan.location.countryCode + '/' + plan.location.city,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Referer': plan.source === 'sms' ? 'https://messages.google.com/' : plan.source === 'whatsapp' ? 'https://web.whatsapp.com/' : plan.source === 'telegram' ? 'https://web.telegram.org/' : 'https://direct.test/',
  };
}

function isRedirect(status: number) { return status >= 300 && status < 400; }

export async function fireRequest(targetUrl: string, plan: ClickPlan, opts?: { followRedirects?: boolean }) {
  const followRedirects = opts?.followRedirects !== false;
  const headers = buildHeaders(plan);
  const start = Date.now();
  let currentUrl = appendTestParams(targetUrl, plan);
  let redirects: string[] = [];
  const maxRedirects = env.MAX_REDIRECTS || 5;

  try {
    for (let hop = 0; hop <= maxRedirects; hop++) {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), env.REQUEST_TIMEOUT_MS);
      const res = await fetch(currentUrl, { headers, redirect: 'manual', signal: controller.signal } as any);
      clearTimeout(t);

      if (isRedirect(res.status) && followRedirects) {
        const loc = res.headers.get('location');
        if (!loc) {
          return { status: res.status, responseMs: Date.now() - start, redirect: loc, redirects, finalUrl: currentUrl, error: null as string | null };
        }
        redirects.push(currentUrl + " -> " + loc + " (" + res.status + ")");
        let next = loc;
        try { next = new URL(loc, currentUrl).toString(); } catch {}
        // Re-append test params to redirect target so the final tracker sees them
        try { next = appendTestParams(next, plan); } catch {}
        currentUrl = next;
        if (hop === maxRedirects) {
          return { status: res.status, responseMs: Date.now() - start, redirect: loc, redirects, finalUrl: currentUrl, error: "max redirects reached" };
        }
        continue;
      }
      return { status: res.status, responseMs: Date.now() - start, redirect: res.headers.get('location'), redirects, finalUrl: currentUrl, error: null as string | null };
    }
    return { status: null, responseMs: Date.now() - start, redirect: null, redirects, finalUrl: currentUrl, error: "max redirects" };
  } catch (e: any) {
    return { status: null, responseMs: Date.now() - start, redirect: null, redirects, finalUrl: currentUrl, error: e.message || String(e) };
  }
}
