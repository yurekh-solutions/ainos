import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import {
  API_LIMITS,
  bodyTooLarge,
  clientIp,
  cronAuthorized,
  getSigningSecret,
  hiddenInProduction,
  isAgentlessWrite,
  isProbeRequest,
  loginGate,
  rateLimit,
  releaseLogin,
} from '../security';

function req(url: string, init?: { method?: string; headers?: Record<string, string> }) {
  return new NextRequest(url, {
    method: init?.method ?? 'GET',
    headers: init?.headers ?? {},
  });
}

/** Re-imports the module with NODE_ENV pinned, because isProd is read at load. */
async function loadFor(nodeEnv: 'production' | 'test') {
  vi.resetModules();
  vi.stubEnv('NODE_ENV', nodeEnv);
  return import('../security');
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('signing secret', () => {
  it('uses the configured NEXTAUTH_SECRET', () => {
    vi.stubEnv('NEXTAUTH_SECRET', 'a-configured-secret-value');
    vi.stubEnv('OTP_SECRET', undefined);
    expect(getSigningSecret()).toBe('a-configured-secret-value');
  });

  it('ignores a too-short env value instead of signing with a guessable key', () => {
    vi.stubEnv('NEXTAUTH_SECRET', 'short');
    vi.stubEnv('OTP_SECRET', undefined);
    expect(getSigningSecret()).not.toBe('short');
    expect(getSigningSecret().length).toBeGreaterThan(15);
  });

  it('stays stable within one process when nothing is configured', () => {
    vi.stubEnv('NEXTAUTH_SECRET', undefined);
    vi.stubEnv('OTP_SECRET', undefined);
    expect(getSigningSecret()).toBe(getSigningSecret());
  });
});

describe('rate limiter', () => {
  it('accepts up to the limit and then refuses with a retry hint', () => {
    const key = `test:limit:${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      expect(rateLimit(key, 3, 60_000).ok).toBe(true);
    }
    const blocked = rateLimit(key, 3, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });

  it('keeps separate budgets per scope', () => {
    const stamp = Math.random();
    expect(rateLimit(`test:a:${stamp}`, 1, 60_000).ok).toBe(true);
    expect(rateLimit(`test:a:${stamp}`, 1, 60_000).ok).toBe(false);
    expect(rateLimit(`test:b:${stamp}`, 1, 60_000).ok).toBe(true);
  });
});

describe('sign-in budget', () => {
  it('locks a target after repeated failures and clears on success', () => {
    const email = `bruteforce-${Math.random()}@example.com`;
    for (let i = 0; i < 8; i++) {
      expect(loginGate('203.0.113.7', email).allowed).toBe(true);
    }
    expect(loginGate('203.0.113.7', email).allowed).toBe(false);

    releaseLogin('203.0.113.7', email);
    expect(loginGate('203.0.113.7', email).allowed).toBe(true);
  });

  it('still works when the caller address is unknown', () => {
    const email = `noip-${Math.random()}@example.com`;
    expect(loginGate(undefined, email).allowed).toBe(true);
  });
});

describe('cron authorization', () => {
  it('fails closed in production when CRON_SECRET is missing', async () => {
    vi.stubEnv('CRON_SECRET', undefined);
    const mod = await loadFor('production');
    const verdict = mod.cronAuthorized(req('http://localhost/api/cron/refresh-credits'));
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toMatch(/^CRON_SECRET/);
  });

  it('accepts bearer, raw header and ?key= forms once the secret exists', () => {
    vi.stubEnv('CRON_SECRET', 'cron-secret-value');
    expect(cronAuthorized(req('http://localhost/api/cron/auto-reminders', {
      headers: { authorization: 'Bearer cron-secret-value' },
    })).ok).toBe(true);

    expect(cronAuthorized(req('http://localhost/api/cron/recurring-invoices', {
      headers: { authorization: 'cron-secret-value' },
    })).ok).toBe(true);

    // Render-native cron jobs can only issue a plain GET, hence the query form.
    expect(cronAuthorized(req('http://localhost/api/cron/auto-reminders?key=cron-secret-value')).ok).toBe(true);
  });

  it('rejects a wrong secret and an anonymous caller', () => {
    vi.stubEnv('CRON_SECRET', 'cron-secret-value');
    expect(cronAuthorized(req('http://localhost/api/cron/auto-reminders?key=nope')).ok).toBe(false);
    expect(cronAuthorized(req('http://localhost/api/cron/auto-reminders')).ok).toBe(false);
  });

  it('stays callable locally with no secret configured', () => {
    vi.stubEnv('CRON_SECRET', undefined);
    expect(cronAuthorized(req('http://localhost/api/cron/auto-reminders')).ok).toBe(true);
  });
});

describe('scanner and bot noise', () => {
  it('flags probes for other stacks and traversal attempts', () => {
    expect(isProbeRequest(req('http://localhost/.env'))).toBe(true);
    expect(isProbeRequest(req('http://localhost/wp-login.php'))).toBe(true);
    expect(isProbeRequest(req('http://localhost/api/customers?path=../../etc/passwd'))).toBe(true);
    expect(isProbeRequest(req('http://localhost/blog', { headers: { 'user-agent': 'sqlmap/1.7' } }))).toBe(true);
  });

  it('leaves genuine traffic alone', () => {
    expect(isProbeRequest(req('http://localhost/blog'))).toBe(false);
    expect(isProbeRequest(req('http://localhost/api/invoices', {
      headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
    }))).toBe(false);
    expect(isProbeRequest(req('http://localhost/_next/image?url=https%3A%2F%2Fimages.unsplash.com%2Fa.jpg&w=640&q=75'))).toBe(false);
  });

  it('reads the caller address from the first proxy hop', () => {
    expect(clientIp(req('http://localhost/api/ping', {
      headers: { 'x-forwarded-for': '198.51.100.9, 10.0.0.1' },
    }))).toBe('198.51.100.9');
    expect(clientIp(req('http://localhost/api/ping'))).toBe('unknown');
  });

  it('treats a header-less write as scripted, not a page view', () => {
    expect(isAgentlessWrite(req('http://localhost/api/newsletter/subscribe', { method: 'POST' }))).toBe(true);
    expect(isAgentlessWrite(req('http://localhost/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'user-agent': 'Mozilla/5.0' },
    }))).toBe(false);
    expect(isAgentlessWrite(req('http://localhost/blog'))).toBe(false);
  });

  it('refuses bodies that are far beyond any form in the product', () => {
    expect(bodyTooLarge(req('http://localhost/api/documents', {
      method: 'POST',
      headers: { 'content-length': String(API_LIMITS.api.limit * 1024) },
    }))).toBe(false);
    expect(bodyTooLarge(req('http://localhost/api/documents', {
      method: 'POST',
      headers: { 'content-length': '99999999' },
    }))).toBe(true);
  });
});

describe('development-only surfaces', () => {
  it('are reachable locally', () => {
    expect(hiddenInProduction('/test-auth')).toBe(false);
    expect(hiddenInProduction('/api/auth/debug')).toBe(false);
  });

  it('answer like a missing route once deployed', async () => {
    const mod = await loadFor('production');
    expect(mod.hiddenInProduction('/test-auth')).toBe(true);
    expect(mod.hiddenInProduction('/api/auth/debug')).toBe(true);
    expect(mod.hiddenInProduction('/blog')).toBe(false);
    expect(mod.hiddenInProduction('/api/invoices')).toBe(false);
  });
});
