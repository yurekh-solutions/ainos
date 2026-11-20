import { NextRequest, NextResponse } from 'next/server';

// Central abuse and secret defenses for AINOS.
//
// Everything here is deliberately additive: no feature is switched off, no
// tenant loses access. What changes is what an anonymous visitor, a scripted
// bot or a leaked signing secret can do — the "guess the password", "hammer
// the cron URL" and "reuse a committed secret" paths get closed.
//
// The counters live in process memory. The app runs as a single Render service,
// so a redeploy or cold start resets the buckets. That is fine for throttling
// scripted abuse; it is not meant to be a permanent ban list.

const isProd = process.env.NODE_ENV === 'production';

/**
 * Signing secret for sessions and OTP hashes.
 *
 * Previously the code fell back to a literal string committed in the public
 * repository, which meant anyone reading the repo could forge a session cookie
 * for any tenant. Now: use NEXTAUTH_SECRET when it is configured, otherwise use
 * a random value that only this process knows. Sessions then simply stop
 * surviving a restart instead of being guessable by an outsider.
 */
let ephemeralSecret: string | undefined;

// Web Crypto rather than the Node "crypto" module: this file is imported by
// middleware, which has to stay bundleable without Node builtins.
function randomSecret(): string {
  const webCrypto = (globalThis as { crypto?: Crypto }).crypto;
  if (webCrypto?.randomUUID) return `${webCrypto.randomUUID()}.${webCrypto.randomUUID()}`;
  return `${Date.now()}.${Math.random().toString(36).slice(2)}`;
}

export function getSigningSecret(): string {
  const fromEnv = process.env.NEXTAUTH_SECRET || process.env.OTP_SECRET;
  if (fromEnv && fromEnv.length >= 16) return fromEnv;
  if (!ephemeralSecret) {
    ephemeralSecret = randomSecret();
    console.error(
      '[security] NEXTAUTH_SECRET is not set — using a random per-process key. ' +
      'Set NEXTAUTH_SECRET in the hosting environment, otherwise every deploy signs ' +
      'new tokens and all users have to sign in again.'
    );
  }
  return ephemeralSecret;
}

/** Best-effort caller identity. Render puts the client address in x-forwarded-for. */
export function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip') || 'unknown';
}

/**
 * Same address lookup for code that does not receive the request object, such
 * as the NextAuth credentials callback. Returns undefined when there is no
 * readable request scope, and callers then apply only their per-account budget
 * instead of charging every user of the site one shared bucket.
 */
export async function requestIp(): Promise<string | undefined> {
  try {
    const { headers } = await import('next/headers');
    const list = await headers();
    const forwarded = list.get('x-forwarded-for');
    const first = forwarded?.split(',')[0]?.trim();
    return first || list.get('x-real-ip') || undefined;
  } catch {
    return undefined;
  }
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

// ── Sliding-window rate limiter ─────────────────────────────────────────────
// Key → timestamps of accepted calls inside the window. Oldest entries are
// dropped as they age out, so a burst costs one array and cannot grow forever.
type Hits = number[];
const windows = new Map<string, Hits>();
const MAX_KEYS = 20_000;
let lastSweep = 0;

function sweep(windowMs: number): void {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  const cutoff = now - Math.max(windowMs, 60_000);
  for (const [key, hits] of windows) {
    while (hits.length && hits[0] < cutoff) hits.shift();
    if (!hits.length) windows.delete(key);
  }
}

/**
 * Consumes one slot of `limit` per `windowMs` for the given key.
 * Returns ok:false with a retry hint once the window is full.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  sweep(windowMs);

  let hits = windows.get(key);
  if (!hits) {
    // Guard against unbounded growth from spoofed keys.
    if (windows.size >= MAX_KEYS) {
      const oldest = windows.keys().next().value;
      if (oldest !== undefined) windows.delete(oldest);
    }
    hits = [];
    windows.set(key, hits);
  }

  while (hits.length && hits[0] <= now - windowMs) hits.shift();

  if (hits.length >= limit) {
    const retryAfterMs = hits[0] + windowMs - now;
    return { ok: false, remaining: 0, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
  }

  hits.push(now);
  return { ok: true, remaining: limit - hits.length, retryAfterSeconds: 0 };
}

/** Per-IP limiter for a named surface, so each endpoint gets its own budget. */
export function ipRateLimit(
  req: NextRequest,
  scope: string,
  limit: number,
  windowMs: number,
) {
  return rateLimit(`ip:${scope}:${clientIp(req)}`, limit, windowMs);
}

/**
 * Route-level budget on top of the middleware baseline. Returns the 429 to send
 * when the address is over budget and null when the call may proceed, so a
 * handler reads as two lines:
 *
 *   const blocked = throttle(req, 'otp-request', 10, 10 * 60_000);
 *   if (blocked) return blocked;
 */
export function throttle(
  req: NextRequest,
  scope: string,
  limit: number,
  windowMs: number,
): NextResponse | null {
  const hit = ipRateLimit(req, scope, limit, windowMs);
  return hit.ok ? null : tooMany(hit.retryAfterSeconds);
}

/** Standard 429 body. Kept in one place so no route leaks internal reasons. */
export function tooMany(retryAfterSeconds: number, message?: string): NextResponse {
  return NextResponse.json(
    { error: message || 'Too many requests. Please slow down and try again in a moment.' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
  );
}

// ── Sign-in attempt budget ──────────────────────────────────────────────────
// Two axes: the address being attacked (so a stolen password list cannot be
// tried against one account) and the source IP (so one operator cannot spray
// across many accounts). A correct password clears both, so a real user who
// mistyped a few times is never punished.
const EMAIL_ATTEMPT_LIMIT = 8;
const EMAIL_ATTEMPT_WINDOW_MS = 15 * 60_000;
const IP_ATTEMPT_LIMIT = 30;
const IP_ATTEMPT_WINDOW_MS = 15 * 60_000;

export function loginGate(ip: string | undefined, email: string): { allowed: boolean; retryAfterSeconds: number } {
  const emailWindow = rateLimit(`login:acct:${email.toLowerCase()}`, EMAIL_ATTEMPT_LIMIT, EMAIL_ATTEMPT_WINDOW_MS);
  const ipWindow = ip
    ? rateLimit(`login:ip:${ip}`, IP_ATTEMPT_LIMIT, IP_ATTEMPT_WINDOW_MS)
    : { ok: true, remaining: 0, retryAfterSeconds: 0 };
  if (emailWindow.ok && ipWindow.ok) return { allowed: true, retryAfterSeconds: 0 };
  return {
    allowed: false,
    retryAfterSeconds: Math.max(emailWindow.retryAfterSeconds, ipWindow.retryAfterSeconds),
  };
}

/** Clears the budget after credentials actually verify. */
export function releaseLogin(ip: string | undefined, email: string): void {
  windows.delete(`login:acct:${email.toLowerCase()}`);
  if (ip) windows.delete(`login:ip:${ip}`);
}

// ── Cron surface ────────────────────────────────────────────────────────────
// These endpoints change billing state and send email to customers. They used
// to answer to anyone when CRON_SECRET was simply not configured, and the
// fallback token was published in a workflow file, so the guard is now
// fail-closed in production and accepts either the bearer header (GitHub
// Actions) or a ?key= parameter (Render cron jobs cannot send headers).
export function cronAuthorized(req: NextRequest): { ok: boolean; reason?: string } {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (isProd) return { ok: false, reason: 'CRON_SECRET is not configured on this deployment' };
    return { ok: true };
  }
  const header = req.headers.get('authorization') || '';
  if (header.startsWith('Bearer ') && constantTimeEquals(header.slice(7), secret)) return { ok: true };
  const queryKey = req.nextUrl.searchParams.get('key');
  if (queryKey && constantTimeEquals(queryKey, secret)) return { ok: true };
  // Also honour the plain token in the header without the Bearer prefix, since
  // some schedulers only let you set a raw header value.
  if (header && constantTimeEquals(header, secret)) return { ok: true };
  return { ok: false, reason: 'Unauthorized' };
}

/** 401/503 response for a rejected cron call, without revealing which half failed. */
export function cronRejected(reason?: string): NextResponse {
  const status = reason?.startsWith('CRON_SECRET') ? 503 : 401;
  return NextResponse.json({ error: reason || 'Unauthorized' }, { status });
}

// ── Scanner / bot noise ─────────────────────────────────────────────────────
// Public marketing pages must stay crawlable by Google, so nothing here touches
// HTML routes. This only rejects requests that probe for other stacks or carry
// attack tooling in the user agent — traffic that can never be a real user of
// this product.
const PROBE_PATHS =
  /(^|\/)(\.env(\.|$)|wp-login\.php|wp-admin|xmlrpc\.php|phpmyadmin|pma|cgi-bin|shell|sh\.php|cmd\.php|bdd\.php|eval\.php|\.git\/|web\.config|\.aws\/|id_rsa|passwd|etc\/passwd|vendor\/phpunit|thinkphp|actuator\/env|solr\/admin|manager\/html)/i;

const HOSTILE_AGENTS =
  /(sqlmap|nikto|nmap|masscan|zgrab|acunetix|nessus|openvas|dirbuster|gobuster|wfuzz|hydra|medusa|wpscan|nuclei|httpx-shell|censysx|python-requests\/2\.[0-4]\b)/i;

export function isProbeRequest(req: NextRequest): boolean {
  const { pathname, search } = req.nextUrl;
  if (PROBE_PATHS.test(pathname) || PROBE_PATHS.test(search)) return true;
  // Directory traversal and inline SQL/JS payloads in the path never occur in
  // this app's own links.
  if (/(\.\.\/|%2e%2e%2f|union\+select|union%20select|<script|onerror=)/i.test(pathname + search)) return true;
  const ua = req.headers.get('user-agent') || '';
  return HOSTILE_AGENTS.test(ua);
}

/**
 * A write with no user agent at all is a script rather than a browser. It is
 * not blocked outright because some schedulers and internal fetches omit the
 * header; it just gets a much smaller request budget.
 */
export function isAgentlessWrite(req: NextRequest): boolean {
  if (req.method === 'GET' || req.method === 'HEAD') return false;
  return !(req.headers.get('user-agent') || '').trim();
}

/** Rejects absurdly large request bodies before any route parses them. */
export const MAX_BODY_BYTES = 15 * 1024 * 1024;

export function bodyTooLarge(req: NextRequest): boolean {
  const len = Number(req.headers.get('content-length') || '0');
  return len > MAX_BODY_BYTES;
}

export function rejectedProbe(): NextResponse {
  // 404 rather than 403 so the response cannot be used to confirm that the
  // path exists behind the guard.
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

/** 413 for bodies over MAX_BODY_BYTES, before any route parses them. */
export function rejectedBody(): NextResponse {
  return NextResponse.json(
    { error: `Request body too large. The limit is ${Math.round(MAX_BODY_BYTES / 1024 / 1024)}MB.` },
    { status: 413 },
  );
}

// Shared budgets so middleware and routes cannot drift apart on the same axis.
// Numbers are sized for a real dashboard session: a page load fans out into a
// handful of calls, and nobody types that fast.
export const API_LIMITS = {
  /** Auth endpoints: sign-in, OTP, registration, password reset. */
  auth: { limit: 120, windowMs: 60_000 },
  /** Everything else under /api for a normal browser session. */
  api: { limit: 300, windowMs: 60_000 },
  /**
   * Writes with no user agent at all - the shape of a script rather than a
   * browser. Not blocked, because schedulers and server-to-server fetches omit
   * the header, just throttled hard.
   */
  agentlessWrite: { limit: 20, windowMs: 60_000 },
} as const;

/**
 * True only outside production. Guards debug surfaces that are useful while
 * building the product but must never answer on the live domain.
 */
export function isDevSurface(): boolean {
  return !isProd;
}

// Development-only surfaces. /test-auth ships pre-filled credentials plus a
// one-click account registration button, and /api/auth/debug reports which
// secrets are configured along with the cookie inventory. Neither is a real
// page, so on the live domain they answer exactly like a missing route.
const DEV_ONLY_PATHS = /^\/(test-auth|api\/auth\/debug)(\/|$)/i;

export function hiddenInProduction(pathname: string): boolean {
  return isProd && DEV_ONLY_PATHS.test(pathname);
}
