// NextAuth v4 answers from NEXTAUTH_URL, not from the request: its
// `utils/detect-origin.js` returns the variable first and only falls back to
// the Host header when it is empty. A deployment that still carries a
// localhost value - a leftover from local OAuth debugging - therefore answers
// real visitors with http://localhost:3000 links: the Google callback, the
// error page and the secure-cookie prefix all point at the developer's
// machine. These helpers correct that single impossible combination and leave
// every other case (local dev, correctly configured production) untouched.

const LOOPBACK_HOST = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;
const LOOPBACK_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?\/?$/i;

/** Proxies send repeated headers as `a, b`; only the first value is ours. */
export function firstHeaderValue(value: string | null | undefined): string | null {
  const first = (value ?? '').split(',')[0].trim();
  return first.length > 0 ? first : null;
}

export function isLoopbackOrigin(value: string): boolean {
  return LOOPBACK_ORIGIN.test(value.trim());
}

/**
 * The public host, preferring the Host header. A proxy that rewrites Host to an
 * internal address leaves X-Forwarded-Host as the only public name, so that
 * header wins exactly in that case and never overrides a real public Host.
 */
function publicHost(hostHeader: string | null, forwardedHost: string | null): string | null {
  const hostIsLoopback = hostHeader ? LOOPBACK_HOST.test(hostHeader) : true;
  if (hostIsLoopback && forwardedHost && !LOOPBACK_HOST.test(forwardedHost)) {
    return forwardedHost;
  }
  return hostHeader ?? forwardedHost;
}

export interface OriginInput {
  host: string | null;
  forwardedHost?: string | null;
  proto?: string | null;
  configured?: string | null;
}

/**
 * Returns the origin NEXTAUTH_URL should hold for THIS request, or null when
 * the configured value is already right and must be left alone.
 */
export function resolveNextAuthOrigin(input: OriginInput): string | null {
  const host = publicHost(input.host ?? null, input.forwardedHost ?? null);
  if (!host) return null;

  const onLoopbackHost = LOOPBACK_HOST.test(host);
  const proto = (input.proto ?? '').toLowerCase() || (onLoopbackHost ? 'http' : 'https');
  const requested = `${proto}://${host}`;
  const configured = (input.configured ?? '').trim();

  // Nothing configured: NextAuth cannot build an absolute URL at all, so pin
  // the request origin. On localhost the framework default is already correct.
  if (!configured) return onLoopbackHost ? null : requested;

  // A genuine localhost request is served by the localhost value.
  if (onLoopbackHost) return null;

  // A public request can never be served by a loopback origin.
  if (isLoopbackOrigin(configured)) return requested;

  return null;
}

/**
 * Applies resolveNextAuthOrigin to the live process env. Called from the
 * [...nextauth] route before the handler runs, because every redirect in the
 * response is built from that variable during the call.
 */
export function pinNextAuthOrigin(headers: Headers): void {
  const origin = resolveNextAuthOrigin({
    host: firstHeaderValue(headers.get('host')),
    forwardedHost: firstHeaderValue(headers.get('x-forwarded-host')),
    proto: firstHeaderValue(headers.get('x-forwarded-proto')),
    configured: process.env.NEXTAUTH_URL,
  });
  if (origin) process.env.NEXTAUTH_URL = origin;
}
