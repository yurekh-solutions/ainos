/**
 * Mobile responsiveness audit.
 *
 * Loads routes in a real headless Chrome at phone width and reports any element
 * that extends past the viewport (the usual cause of horizontal scrolling /
 * "screen shaking" on phones).
 *
 * Usage:
 *   node scripts/mobile-audit.cjs [baseUrl]
 *   node scripts/mobile-audit.cjs --routes=scripts/mobile-app-routes.txt --cookie=_mobile-cookie.txt --widths=390
 */

const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const argv = process.argv.slice(2);
const flags = Object.fromEntries(
  argv
    .filter((arg) => arg.startsWith('--'))
    .map((arg) => {
      const [key, ...rest] = arg.replace(/^--/, '').split('=');
      return [key, rest.join('=')];
    }),
);
const positional = argv.filter((arg) => !arg.startsWith('--'));
const BASE = (positional[0] || process.env.BASE || 'http://127.0.0.1:3000').trim().replace(/\/$/, '');
const WIDTHS = (flags.widths ? flags.widths.split(',') : ['390', '360', '768']).map(Number);
const BLOG_SAMPLE = 3;
const PROFILE_TAG = 'ainos-mobile-audit';
const ROUTES_FILE = flags.routes;
const COOKIE_FILE = flags.cookie;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

function launchChrome(port) {
  const profile = path.join(os.tmpdir(), `${PROFILE_TAG}-${Date.now()}`);
  fs.mkdirSync(profile, { recursive: true });
  const child = spawn(
    CHROME,
    [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--hide-scrollbars',
      '--window-size=390,844',
      'about:blank',
    ],
    { stdio: 'ignore', detached: false },
  );
  return { child, profile };
}

async function getBrowserEndpoint(port) {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) {
        const json = await res.json();
        return json.webSocketDebuggerUrl;
      }
    } catch {
      /* not up yet */
    }
    await wait(250);
  }
  throw new Error('Chrome DevTools endpoint did not start');
}

function connect(url) {
  const ws = new WebSocket(url);
  let nextId = 0;
  const pending = new Map();
  const listeners = new Map();

  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result);
      return;
    }
    if (message.method) {
      const handler = listeners.get(message.method);
      if (handler) handler(message.params, message.sessionId);
    }
  });

  const ready = new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', () => reject(new Error('CDP socket error')));
  });

  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      nextId += 1;
      const id = nextId;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params, sessionId }));
    });

  return { ws, ready, send, on: (method, fn) => listeners.set(method, fn) };
}

const MEASURE = `(() => {
  const vw = window.innerWidth;
  const doc = document.documentElement;
  const describe = (el) => {
    const parts = [];
    let node = el;
    for (let depth = 0; node && node.nodeType === 1 && depth < 4; depth += 1) {
      let selector = node.tagName.toLowerCase();
      if (node.id) selector += '#' + node.id;
      const cls = (node.getAttribute('class') || '').trim().split(/\\s+/).filter(Boolean).slice(0, 4).join('.');
      if (cls) selector += '.' + cls;
      parts.unshift(selector);
      node = node.parentElement;
    }
    return parts.join(' > ');
  };

  const offenders = [];
  for (const el of document.querySelectorAll('body *')) {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.position === 'fixed') continue;
    if (style.overflowX !== 'visible' && style.overflowX !== 'clip') continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    const right = rect.right + window.scrollX;
    const left = rect.left + window.scrollX;
    if (right > vw + 1.5 || left < -1.5) {
      offenders.push({
        sel: describe(el),
        right: Math.round(right),
        left: Math.round(left),
        width: Math.round(rect.width),
        text: (el.textContent || '').trim().slice(0, 70),
      });
    }
  }

  const seen = new Set();
  const unique = offenders
    .sort((a, b) => b.width - a.width)
    .filter((item) => {
      if (seen.has(item.sel)) return false;
      seen.add(item.sel);
      return true;
    })
    .slice(0, 6);

  return {
    vw,
    scrollWidth: doc.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    overflow: doc.scrollWidth - vw,
    offenders: unique,
  };
})()`;

async function auditRoute(cdp, sessionId, route, width) {
  await cdp.send(
    'Emulation.setDeviceMetricsOverride',
    { width, height: 844, deviceScaleFactor: 2, mobile: true },
    sessionId,
  );

  let loaded = false;
  const onLoad = (params, sid) => {
    if (sid === sessionId) loaded = true;
  };
  cdp.on('Page.loadEventFired', onLoad);

  await cdp.send('Page.navigate', { url: `${BASE}${route}` }, sessionId);
  for (let i = 0; i < 120 && !loaded; i += 1) await wait(100);
  await wait(700);

  const result = await cdp.send(
    'Runtime.evaluate',
    {
      expression: `(() => ({ measure: ${MEASURE}, landed: location.pathname }))()`,
      returnByValue: true,
      awaitPromise: false,
    },
    sessionId,
  );

  const value = result.result.value || {};
  return { ...(value.measure || {}), landed: value.landed };
}

async function setSessionCookies(cdp, sessionId, cookieFile) {
  if (!fs.existsSync(cookieFile)) {
    console.log(`cookie file ${cookieFile} not found - run \`npm run mobile:session\` first`);
    return 0;
  }
  const raw = fs.readFileSync(cookieFile, 'utf8').trim();
  let count = 0;
  for (const pair of raw.split(';')) {
    const index = pair.indexOf('=');
    if (index < 1) continue;
    const name = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    await cdp.send(
      'Network.setCookie',
      { name, value, domain: '127.0.0.1', path: '/', httpOnly: true, sameSite: 'Lax' },
      sessionId,
    );
    count += 1;
  }
  return count;
}

async function collectRoutes() {
  if (ROUTES_FILE) {
    return fs
      .readFileSync(ROUTES_FILE, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'));
  }

  const fixed = [
    '/',
    '/features',
    '/features/finance',
    '/features/accounting',
    '/features/crm',
    '/features/marketing',
    '/features/ai-studio',
    '/features/crm/deals',
    '/features/accounting/gst-reports',
    '/features/finance/invoices',
    '/business-suite',
    '/pricing',
    '/about',
    '/contact',
    '/blog',
    '/glossary',
    '/faq',
    '/site-map',
    '/tools',
    '/auth/login',
    '/auth/register',
  ];

  const routes = [...fixed];
  try {
    const res = await fetch(`${BASE}/sitemap.xml`);
    const xml = await res.text();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const blogs = [];
    for (const url of urls) {
      const route = url.replace(/^https?:\/\/[^/]+/, '') || '/';
      if (routes.includes(route)) continue;
      if (route.startsWith('/blog/')) {
        blogs.push(route);
        continue;
      }
      routes.push(route);
    }
    routes.push(...blogs.slice(0, BLOG_SAMPLE));
  } catch (error) {
    console.log('sitemap unavailable:', error.message);
  }

  return [...new Set(routes)];
}

async function main() {
  const routes = await collectRoutes();
  console.log(`Auditing ${routes.length} routes at widths ${WIDTHS.join(', ')} against ${BASE}\n`);

  const port = await freePort();
  const { child, profile } = launchChrome(port);
  const cleanup = () => {
    try {
      child.kill();
    } catch {
      /* ignore */
    }
    try {
      fs.rmSync(profile, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  };

  let failures = 0;
  try {
    const endpoint = await getBrowserEndpoint(port);
    const cdp = connect(endpoint);
    await cdp.ready;

    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);

    if (COOKIE_FILE) {
      await cdp.send('Network.enable', {}, sessionId);
      const stored = await setSessionCookies(cdp, sessionId, COOKIE_FILE);
      console.log(`session cookies applied: ${stored}\n`);
    }

    for (const route of routes) {
      const notes = [];
      let routeFailed = false;
      for (const width of WIDTHS) {
        const result = await auditRoute(cdp, sessionId, route, width);
        if (!result) {
          notes.push(`${width}px no result`);
          routeFailed = true;
          continue;
        }
        if (result.overflow > 1) {
          routeFailed = true;
          notes.push(`${width}px overflows by ${result.overflow}px (doc ${result.scrollWidth})`);
          for (const item of result.offenders) {
            notes.push(`   ${width}px | w=${item.width} right=${item.right} | ${item.sel} | "${item.text}"`);
          }
        }
        if (width === WIDTHS[0] && result.landed && result.landed !== route.replace(/\/$/, '')) {
          routeFailed = true;
          notes.push(`landed on ${result.landed} instead of ${route}`);
        }
      }
      if (routeFailed) {
        failures += 1;
        console.log(`FAIL ${route}`);
        for (const note of notes) console.log(`  ${note}`);
      } else {
        console.log(`ok   ${route}`);
      }
      // Flush per route so a long run can be watched from the log file.
      process.stdout.write('');
    }
  } finally {
    cleanup();
  }

  console.log(`\n${failures === 0 ? 'ALL_PASS' : `FAILURES: ${failures}`}`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main().catch((error) => {
  console.error('AUDIT_ERROR', error);
  process.exitCode = 1;
});