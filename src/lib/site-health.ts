import { prisma } from '@/lib/prisma';
import type { ConnectedWebsite } from '@prisma/client';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

// Connection health for websites that embed the AINOS blog widget.
// Two independent signals decide whether a site is really connected:
//   1. Sightings — embed.js pings /api/blog-agent/widget-ping on every page load.
//   2. Page check — the server fetches the site and looks for the embed code.
// Status changes notify every user of the company, so AINOS (and the owner)
// knows the moment a site goes live or the blog code disappears.

export type ConnectionStatus = 'pending' | 'connected' | 'disconnected';
export type CheckResult = 'code_found' | 'code_missing' | 'site_unreachable';

// A widget sighting keeps a site "connected" this long; quiet sites are
// still confirmed by the page check finding the code.
const SEEN_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;
// Sightings closer together than this skip the DB write
const SIGHTING_THROTTLE_MS = 10 * 60 * 1000;

// An empty container alone does not prove the widget was installed.
const EMBED_MARKERS = /<script\b[^>]*\bsrc\s*=\s*["'][^"']*ainos[^"']*\/embed\.js(?:\?[^"']*)?["']/i;

// Posts become visible on client sites only once their go-live date arrives
export const liveNow = () => ({ OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }] });

// "https://www.SkyAV.in/some/path" -> "skyav.in"
export function normalizeHost(u: string): string {
  try {
    const url = new URL(u.startsWith('http') ? u : `https://${u}`);
    return url.host.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

export async function findWebsitesByHost(siteUrl: string): Promise<ConnectedWebsite[]> {
  const host = normalizeHost(siteUrl);
  if (!host) return [];
  const candidates = await prisma.connectedWebsite.findMany({
    where: { isActive: true, url: { contains: host, mode: 'insensitive' } },
  });
  return candidates.filter(w => normalizeHost(w.url) === host);
}

async function notifyCompany(companyId: string | null, title: string, message: string, type: string) {
  if (!companyId) return;
  try {
    const users = await prisma.user.findMany({ where: { companyId }, select: { id: true } });
    if (users.length === 0) return;
    await prisma.notification.createMany({
      data: users.map(u => ({ userId: u.id, companyId, title, message, type })),
    });
  } catch (err) {
    console.error('[Site Health] notify failed:', err);
  }
}

async function announceTransition(w: ConnectedWebsite, next: ConnectionStatus, result?: CheckResult) {
  const host = normalizeHost(w.url) || w.url;
  if (next === 'pending' && result && result !== w.lastCheckResult) {
    await notifyCompany(w.companyId, 'Website setup not confirmed',
      result === 'site_unreachable'
        ? `${host} could not be reached. Check your website and try Check Connection again.`
        : `The AINOS embed script was not found on ${host}. Add the embed code and open that page to confirm the connection.`,
      'website_setup');
    return;
  }
  if (next === w.connectionStatus) return;
  if (next === 'connected') {
    const back = w.connectionStatus === 'disconnected';
    await notifyCompany(
      w.companyId,
      back ? 'Website reconnected' : 'Website connected',
      back
        ? `AINOS blogs are showing on ${host} again.`
        : `The AINOS blog integration was detected on ${host}. Articles become available on their scheduled dates.`, 
      'website_connected',
    );
    console.log(`[Site Health] ${host} -> connected`);
  } else if (next === 'disconnected') {
    const reason = result === 'site_unreachable'
      ? `${host} could not be reached`
      : `the AINOS blog code was not found on ${host}`;
    await notifyCompany(
      w.companyId,
      'Website connection lost',
      `We checked and ${reason}. Add the embed code back so your scheduled blogs keep showing to visitors.`,
      'website_disconnected',
    );
    console.log(`[Site Health] ${host} -> disconnected (${result})`);
  }
}

// Called for every widget ping. Marks matching websites connected and
// records where the widget was seen.
export async function recordWidgetSighting(siteUrl: string): Promise<ConnectedWebsite[]> {
  const sites = await findWebsitesByHost(siteUrl);
  const now = new Date();
  for (const w of sites) {
    const recent = w.widgetLastSeenAt && now.getTime() - w.widgetLastSeenAt.getTime() < SIGHTING_THROTTLE_MS;
    if (recent && w.connectionStatus === 'connected') continue;
    const updated = await prisma.connectedWebsite.updateMany({
      where: { id: w.id, isActive: true, updatedAt: w.updatedAt },
      data: {
        widgetIntegrated: true,
        widgetIntegratedAt: w.widgetIntegratedAt ?? now,
        widgetLastSeenAt: now,
        widgetLastSeenUrl: siteUrl.slice(0, 500),
        connectionStatus: 'connected',
      },
    });
    if (updated.count) await announceTransition(w, 'connected');
  }
  return sites;
}

// Only public HTTP(S) destinations are eligible, including redirect targets.
// Reject all private/reserved DNS answers rather than trusting the URL string.
export function isPublicAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b] = address.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224
      || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 168 || b === 0))
      || (a === 198 && (b === 18 || b === 19 || b === 51)) || (a === 203 && b === 0));
  }
  return isIP(address) === 6 && /^[23][0-9a-f]{3}:/i.test(address) && !/^2001:db8:/i.test(address);
}

async function publicUrl(value: string): Promise<URL | null> {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password
      || (url.port && !['80', '443'].includes(url.port))) return null;
    const host = url.hostname.replace(/^\[|\]$/g, '');
    const answers = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
    return answers.length && answers.every(a => isPublicAddress(a.address)) ? url : null;
  } catch { return null; }
}

async function fetchPage(value: string): Promise<{ ok: boolean; html: string }> {
  try {
    let target = value;
    const signal = AbortSignal.timeout(12_000);
    for (let redirects = 0; redirects <= 3; redirects++) {
      const url = await publicUrl(target);
      if (!url || signal.aborted) return { ok: false, html: '' };
      const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AINOS-ConnectionCheck/1.0; +https://ainos-ywu0.onrender.com)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'manual',
      cache: 'no-store',
      signal,
      });
      if ([301, 302, 303, 307, 308].includes(res.status)) {
        const location = res.headers.get('location');
        await res.body?.cancel();
        if (!location) return { ok: false, html: '' };
        target = new URL(location, url).href;
        continue;
      }
      if (!res.ok || !(res.headers.get('content-type') || '').includes('text/html')) {
        await res.body?.cancel();
        return { ok: false, html: '' };
      }
      const reader = res.body?.getReader();
      if (!reader) return { ok: false, html: '' };
      const decoder = new TextDecoder();
      let html = '';
      let bytes = 0;
      try {
        for (;;) {
          const chunk = await reader.read();
          if (chunk.done) break;
          const remaining = 2_000_000 - bytes;
          html += decoder.decode(chunk.value.subarray(0, remaining), { stream: true });
          bytes += chunk.value.length;
          if (bytes >= 2_000_000) break;
        }
        html += decoder.decode();
      } finally { await reader.cancel(); }
      return { ok: true, html };
    }
    return { ok: false, html: '' };
  } catch {
    return { ok: false, html: '' };
  }
}

// Fetches the homepage (and /blog) looking for the embed code, then derives
// the connection status from that plus recent widget sightings.
export async function checkWebsiteConnection(websiteId: string): Promise<ConnectedWebsite | null> {
  const w = await prisma.connectedWebsite.findUnique({ where: { id: websiteId } });
  if (!w || !w.isActive) return w;

  const base = w.url.startsWith('http') ? w.url : `https://${w.url}`;
  // Check the last observed embed page too, so installations on /articles or
  // custom routes do not become disconnected simply because /blog is empty.
  const pages = [...new Set([base, new URL('/blog', base).href,
    ...(w.widgetLastSeenUrl && normalizeHost(w.widgetLastSeenUrl) === normalizeHost(base) ? [w.widgetLastSeenUrl] : [])])];
  let reachable = false;
  let found = false;
  for (const page of pages) {
    const { ok, html } = await fetchPage(page);
    if (!ok) continue;
    reachable = true;
    if (EMBED_MARKERS.test(html)) { found = true; break; }
  }

  const result: CheckResult = found ? 'code_found' : reachable ? 'code_missing' : 'site_unreachable';
  const fresh = await prisma.connectedWebsite.findUnique({ where: { id: w.id } });
  if (!fresh || !fresh.isActive) return fresh;
  const seenRecently = !!fresh.widgetLastSeenAt && Date.now() - fresh.widgetLastSeenAt.getTime() < SEEN_WINDOW_MS;
  // Sites built with JS frameworks may inject the script at runtime, so a
  // recent sighting counts even when the raw HTML doesn't show the code.
  const next: ConnectionStatus = found || seenRecently
    ? 'connected'
    : fresh.connectionStatus === 'connected' || fresh.widgetLastSeenAt ? 'disconnected' : 'pending';

  const updated = await prisma.connectedWebsite.updateMany({
    where: { id: fresh.id, isActive: true, updatedAt: fresh.updatedAt },
    data: {
      lastCheckedAt: new Date(),
      lastCheckResult: result,
      connectionStatus: next,
      widgetIntegrated: next === 'connected',
      ...(next === 'connected' ? { widgetIntegratedAt: fresh.widgetIntegratedAt ?? new Date() } : {}),
    },
  });
  if (updated.count) await announceTransition(fresh, next, result);
  return prisma.connectedWebsite.findUnique({ where: { id: fresh.id } });
}

// Re-checks every active website not checked within `maxAgeMs` (cron use).
export async function runHealthChecks(maxAgeMs = 20 * 60 * 60 * 1000) {
  const cutoff = new Date(Date.now() - maxAgeMs);
  const due = await prisma.connectedWebsite.findMany({
    where: { isActive: true, OR: [{ lastCheckedAt: null }, { lastCheckedAt: { lt: cutoff } }] },
    select: { id: true },
  });
  const summary = { checked: 0, connected: 0, disconnected: 0, pending: 0 };
  for (const { id } of due) {
    const w = await checkWebsiteConnection(id);
    if (!w) continue;
    summary.checked++;
    summary[w.connectionStatus as ConnectionStatus] = (summary[w.connectionStatus as ConnectionStatus] || 0) + 1;
  }
  return summary;
}
