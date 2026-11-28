const CANONICAL_HOST = 'ainossuite.com';
const ORIGIN_URL = `https://${CANONICAL_HOST}`;
const CACHE_NAME = 'ainos-public-v1';
const CACHE_TTL_MS = 5 * 60 * 1000;
const STALE_TTL_MS = 24 * 60 * 60 * 1000;
const WARM_PATHS = [
  '/api/ping',
];

const SIDE_SERVICES = [
  'https://ainos-gst-scraper.onrender.com/api/v1/health',
  'https://ainos-template-extractor.onrender.com/api/v1/health',
];

const RENDER_SPLASH_RE = /APPLICATION\s+LOADING|WAKING\s+UP|ALLOCATING\s+COMPUTE|WELCOME\s+TO\s+AINOSSAAS/i;

function isRenderSplash(body) {
  return RENDER_SPLASH_RE.test(body);
}

function isNavigation(request) {
  return request.method === 'GET' && (request.headers.get('accept') || '').includes('text/html');
}

function isAnonymousNavigation(request) {
  return isNavigation(request)
    && !request.headers.has('cookie')
    && !request.headers.has('authorization')
    && !request.headers.has('rsc')
    && !request.headers.has('next-router-prefetch')
    && !request.headers.has('next-router-state-tree');
}

function isCacheablePath(pathname) {
  return pathname === '/';
}

function cacheKeyFor(url) {
  const cached = new URL(url);
  cached.hostname = CANONICAL_HOST;
  cached.search = '';
  return cached.toString();
}

function loadingPage(request) {
  const target = new URL(request.url);
  target.hostname = CANONICAL_HOST;
  const safeTarget = target.toString().replace(/"/g, '&quot;');
  return new Response(`<!doctype html>
<html lang="en-IN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="8;url=${safeTarget}"><title>Opening AINOS</title>
<style>html,body{margin:0;height:100%;background:#0b0b12;color:#fff;font-family:system-ui,sans-serif}main{height:100%;display:grid;place-items:center;text-align:center}div{max-width:320px;padding:32px}b{display:block;font-size:28px;letter-spacing:.08em;margin-bottom:12px}span{color:#b9b9c9;font-size:15px}i{display:block;width:36px;height:36px;margin:0 auto 22px;border:3px solid #33334a;border-top-color:#a78bfa;border-radius:50%;animation:s 1s linear infinite}@keyframes s{to{transform:rotate(360deg)}}</style>
</head><body><main><div><i></i><b>AINOS</b><span>Opening your workspace securely…</span></div></main></body></html>`, {
    status: 503,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'retry-after': '8',
      'x-ainos-shield': 'origin-warming',
    },
  });
}

function unavailable(request) {
  if (isNavigation(request)) return loadingPage(request);
  return new Response(JSON.stringify({ error: 'AINOS is starting. Please retry in a few seconds.' }), {
    status: 503,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
      'retry-after': '8',
      'x-ainos-shield': 'origin-warming',
    },
  });
}

function cleanResponse(response) {
  const headers = new Headers(response.headers);
  headers.delete('x-render-origin-server');
  headers.delete('x-render-routing');
  headers.delete('rndr-id');
  headers.set('x-ainos-shield', 'protected');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function readCached(cache, key) {
  const cached = await cache.match(key);
  if (!cached) return null;
  const savedAt = Number(cached.headers.get('x-ainos-cached-at') || 0);
  const age = Date.now() - savedAt;
  if (age > STALE_TTL_MS) {
    await cache.delete(key);
    return null;
  }
  return cached;
}

async function fetchOrigin(request) {
  const url = new URL(request.url);
  url.hostname = CANONICAL_HOST;
  return fetch(new Request(url.toString(), request), {
    redirect: 'manual',
  });
}

async function refreshHomepage(cache, key) {
  const response = await fetch(`${ORIGIN_URL}/`, {
    headers: { accept: 'text/html' },
    redirect: 'manual',
  });
  if (!response.ok || response.headers.has('set-cookie')) return;
  const copy = response.clone();
  const contentType = copy.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return;
  const body = await copy.text();
  if (isRenderSplash(body)) return;
  const headers = new Headers(response.headers);
  headers.set('cache-control', 'public, max-age=0, must-revalidate');
  headers.set('x-ainos-cached-at', String(Date.now()));
  headers.set('x-ainos-shield', 'cached');
  await cache.put(key, new Response(body, { status: response.status, headers }));
}

async function proxy(request, ctx) {
  const url = new URL(request.url);
  const cacheable = isCacheablePath(url.pathname) && isAnonymousNavigation(request);

  if (cacheable) {
    const cache = await caches.open(CACHE_NAME);
    const key = cacheKeyFor(url);
    const cached = await readCached(cache, key);
    if (cached && Date.now() - Number(cached.headers.get('x-ainos-cached-at') || 0) < CACHE_TTL_MS) {
      return cached;
    }
    if (cached) {
      ctx.waitUntil(refreshHomepage(cache, key).catch(() => {}));
      return cached;
    }
  }

  try {
    const response = await fetchOrigin(request);
    const contentType = response.headers.get('content-type') || '';

    if (response.ok && contentType.includes('text/html')) {
      const copy = response.clone();
      const body = await copy.text();
      if (isRenderSplash(body)) {
        if (cacheable) {
          const cache = await caches.open(CACHE_NAME);
          ctx.waitUntil(refreshHomepage(cache, cacheKeyFor(url)).catch(() => {}));
        }
        return unavailable(request);
      }
    }

    const cleaned = cleanResponse(response);
    if (cacheable && response.ok && !response.headers.has('set-cookie')) {
      const cache = await caches.open(CACHE_NAME);
      const key = cacheKeyFor(url);
      const headers = new Headers(cleaned.headers);
      headers.set('cache-control', 'public, max-age=0, must-revalidate');
      headers.set('x-ainos-cached-at', String(Date.now()));
      headers.set('x-ainos-shield', 'cached');
      await cache.put(key, new Response(cleaned.clone().body, { status: cleaned.status, headers }));
    }
    return cleaned;
  } catch {
    if (cacheable) {
      const cache = await caches.open(CACHE_NAME);
      const cached = await readCached(cache, cacheKeyFor(url));
      if (cached) return cached;
    }
    return unavailable(request);
  }
}

async function warmOne(url) {
  // The app ping and both Flask helpers answer JSON. A Render wake page is
  // HTML, so treating HTML as a failed warm makes the retry keep pulling the
  // real service up instead of accepting the host's loading screen.
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'user-agent': 'ainos-cloudflare-warmer' },
        redirect: 'manual',
        signal: AbortSignal.timeout(75000),
      });
      const contentType = response.headers.get('content-type') || '';
      const healthy = response.ok && !contentType.includes('text/html');
      await response.body?.cancel();
      if (healthy) {
        console.log('warm-ok', url, response.status);
        return;
      }
      console.warn('warm-retry', url, response.status, contentType);
    } catch {
      // A cold boot can time out once; the retry below gives it another chance.
    }
    if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 5000));
  }
  console.error('warm-failed', url);
}

async function warmServices() {
  const targets = [
    ...WARM_PATHS.map(path => `${ORIGIN_URL}${path}`),
    ...SIDE_SERVICES,
  ];
  await Promise.allSettled(targets.map(warmOne));
}

export default {
  async fetch(request, env, ctx) {
    return proxy(request, ctx);
  },

  async scheduled(controller, env, ctx) {
    ctx.waitUntil(warmServices());
  },
};

export { isRenderSplash, isNavigation, isAnonymousNavigation, isCacheablePath };
