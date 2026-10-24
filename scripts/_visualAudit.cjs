// Drives headless Chrome over CDP at real mobile/tablet widths, logs in as the
// QA tenant, and reports every element that sticks out past the viewport.
//
//   node --env-file=.env scripts/_visualAudit.cjs
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9333;
const BASE = process.env.QA_BASE || 'http://localhost:3007';
const SHOTS = path.join(__dirname, '..', '..', 'qa-shots');
const EMAIL = 'qa.visual@ainos-test.com';
const PASSWORD = 'VisualQa12345';

const ONLY = process.argv.slice(2).find((arg) => !arg.startsWith('--')) || '';
const FULL = process.argv.includes('--full');
const ALL = process.argv.includes('--all');
const SCROLL_Y = Number((process.argv.find((arg) => arg.startsWith('--scrollY=')) || '').split('=')[1] || 0);
const MEASURE = (process.argv.find((arg) => arg.startsWith('--measure=')) || '').slice('--measure='.length)
  || (() => {
    const file = (process.argv.find((arg) => arg.startsWith('--measureFile=')) || '').split('=')[1];
    return file ? fs.readFileSync(path.join(__dirname, file), 'utf8') : '';
  })();

/** Every static dashboard route (dynamic [id]/[slug] pages are skipped). */
function discoverRoutes() {
  const root = path.join(__dirname, '..', 'src', 'app', '(dashboard)');
  const routes = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith('[') || entry.name.startsWith('(')) { if (entry.name.startsWith('(')) walk(full); continue; }
        walk(full);
      } else if (entry.name === 'page.tsx') {
        const rel = path.relative(root, dir).split(path.sep).join('/');
        routes.push(rel ? '/' + rel : '/dashboard');
      }
    }
  })(root);
  return routes.sort();
}

const DASHBOARD_ROUTES = [
  '/dashboard', '/billing/credits', '/invoices', '/customers', '/tools',
  '/finance/expenses', '/finance/recurring-invoices', '/crm/follow-ups',
  '/approvals', '/operations/repair', '/operations/fleet',
  '/compliance/documents', '/marketing/events', '/planning', '/rental',
];
const PUBLIC_ROUTES = ['/', '/auth/signin', '/auth/register'];
const TABLET_ROUTES = ['/dashboard', '/billing/credits', '/invoices', '/finance/expenses'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let msgId = 0;
const pending = new Map();
const waiters = new Map();
let ws;
let session;

function send(method, params = {}) {
  const id = ++msgId;
  ws.send(JSON.stringify({ id, method, params, sessionId: session }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

function waitEvent(method, timeout = 30000) {
  const key = `${session}:${method}`;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout waiting ${method}`)), timeout);
    const list = waiters.get(key) || [];
    list.push((params) => { clearTimeout(timer); resolve(params); });
    waiters.set(key, list);
  });
}

function onMessage(raw) {
  const msg = JSON.parse(raw);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    return;
  }
  if (msg.method) {
    const list = waiters.get(`${msg.sessionId}:${msg.method}`);
    if (list && list.length) list.shift()(msg.params);
  }
}

async function evaluate(expression) {
  const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (res.exceptionDetails) throw new Error(res.exceptionDetails.exception?.description || res.exceptionDetails.text);
  return res.result.value;
}

async function viewport(width, height) {
  await send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile: width < 600, screenWidth: width, screenHeight: height,
  });
}

async function goto(url) {
  const loaded = waitEvent('Page.loadEventFired').catch(() => null);
  await send('Page.navigate', { url });
  await loaded;
  await sleep(1800);
}

const PROBE = `(() => {
  const vw = window.innerWidth;
  const offenders = [];
  // Content inside a horizontal scroller is reachable by swiping, so it is not
  // clipped. The scroller itself is still measured.
  const inScroller = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX;
      if (o === 'auto' || o === 'scroll') return true;
    }
    return false;
  };
  // Closed off-canvas panels sit just outside the viewport on purpose.
  const inClosedPanel = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const ps = getComputedStyle(p);
      if (ps.position !== 'fixed' && ps.position !== 'absolute') continue;
      const pr = p.getBoundingClientRect();
      if (pr.width < 1) continue;
      if (pr.left >= vw - 1 || pr.right <= 1) return true;
    }
    return false;
  };
  for (const el of document.querySelectorAll('body *')) {
    if (el.ownerSVGElement) continue; // vectors, not layout boxes
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    if (r.right <= vw + 2 && r.left >= -2) continue;
    const cs = getComputedStyle(el);
    if (cs.position === 'fixed' || cs.visibility === 'hidden' || cs.display === 'none') continue;
    // Decorative art: positioned blobs with no text never truncate anything.
    if (cs.position === 'absolute' && !el.textContent.trim() && !['IMG', 'CANVAS', 'INPUT', 'BUTTON', 'A'].includes(el.tagName)) continue;
    if (inScroller(el)) continue;
    if (inClosedPanel(el)) continue;
    // Leaf nodes only: a wide parent is usually just its wide child plus padding.
    if (el.children.length > 0) continue;
    offenders.push({
      tag: el.tagName.toLowerCase(),
      cls: String(el.className || '').slice(0, 130),
      text: (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 45),
      left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width),
    });
  }
  // Real clipping: overflow hidden on a real container hiding reachable content.
  const clipped = [...document.querySelectorAll('div,section,main,article')].filter(el => {
    const cs = getComputedStyle(el);
    if (cs.overflowX !== 'hidden' && cs.overflowX !== 'clip') return false;
    if (el.clientWidth < 1 || el.scrollWidth <= el.clientWidth + 2) return false;
    return !inScroller(el);
  }).slice(0, 5).map(el => ({ tag: el.tagName.toLowerCase(), cls: String(el.className || '').slice(0, 90), scrollW: el.scrollWidth, clientW: el.clientWidth }));
  return {
    vw, vh: window.innerHeight,
    docScrollW: document.documentElement.scrollWidth,
    clippedContainers: clipped,
    offenderCount: offenders.length,
    offenders: offenders.slice(0, 6),
  };
})()`;

async function audit(label, slug, shrink) {
  const data = await evaluate(PROBE);
  const worst = data.offenders.length ? data.offenders : data.clippedContainers;
  const offenders = data.offenders.slice(0, 3).map((o) => `${o.tag}.${o.cls.split(' ').slice(0, 3).join('.')} [${o.left}..${o.right}] "${o.text}"`);
  console.log(`${shrink || data.offenderCount ? 'FAIL' : 'PASS'}  ${label}  vw=${data.vw} scrollW=${data.docScrollW} offenders=${data.offenderCount}`);
  for (const line of offenders) console.log('        ' + line);
  if (data.clippedContainers.length) {
    console.log('        clipped: ' + data.clippedContainers.map((c) => `${c.tag}.${c.cls.split(' ')[0]}(${c.scrollW}>${c.clientW})`).join(' '));
  }
  if (slug) {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SHOTS, slug + '.png'), Buffer.from(shot.data, 'base64'));
    if (FULL) {
      const full = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
      fs.writeFileSync(path.join(SHOTS, slug + '_full.png'), Buffer.from(full.data, 'base64'));
    }
  }
  return data;
}

async function login() {
  await goto(BASE + '/auth/signin');
  const result = await evaluate(`(() => {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    const email = document.querySelector('input[type=email], input[name=email], #email');
    const pass = document.querySelector('input[type=password]');
    if (!email || !pass) return 'no fields';
    set.call(email, ${JSON.stringify(EMAIL)}); email.dispatchEvent(new Event('input', { bubbles: true }));
    set.call(pass, ${JSON.stringify(PASSWORD)}); pass.dispatchEvent(new Event('input', { bubbles: true }));
    const form = email.closest('form');
    if (form) { form.requestSubmit(); return 'submitted'; }
    const btn = document.querySelector('button[type=submit]'); if (btn) { btn.click(); return 'clicked'; }
    return 'no submit';
  })()`);
  await sleep(5000);
  const where = await evaluate('location.pathname');
  console.log(`login: ${result} -> ${where}`);
  return where !== '/auth/signin';
}

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ainos-cdp-'));
  const chrome = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
    '--force-device-scale-factor=1', 'about:blank',
  ], { stdio: 'ignore' });

  let wsUrl = '';
  for (let i = 0; i < 60 && !wsUrl; i++) {
    try {
      const version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
      wsUrl = version.webSocketDebuggerUrl || '';
    } catch { await sleep(250); }
  }
  if (!wsUrl) throw new Error('chrome did not expose a debugging endpoint');

  ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  ws.onmessage = (event) => onMessage(event.data);

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const attached = await send('Target.attachToTarget', { targetId, flatten: true });
  session = attached.sessionId;
  await send('Page.enable');
  await send('Runtime.enable');

  await viewport(390, 844);
  const ok = await login();
  if (!ok) console.log('WARNING: login did not reach the dashboard');

  const mobileRoutes = ONLY || ALL ? [] : DASHBOARD_ROUTES;
  const publicRoutes = ONLY || ALL ? [] : PUBLIC_ROUTES;
  const tabletRoutes = ONLY || ALL ? [] : TABLET_ROUTES;

  if (ALL) {
    const discovered = discoverRoutes();
    console.log(`\n== All dashboard routes at 390x844 (${discovered.length}) ==`);
    let failures = 0;
    for (const route of discovered) {
      await goto(BASE + route);
      const data = await audit(route, null);
      if (data.offenderCount > 0) failures++;
    }
    console.log(`\n${failures} route(s) with content past the viewport edge`);
  }

  console.log('\n== Mobile 390x844 ==');
  for (const route of mobileRoutes) {
    await goto(BASE + route);
    const slug = '390_' + route.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '');
    await audit(route, slug);
  }

  console.log('\n== Public 390x844 ==');
  for (const route of publicRoutes) {
    await goto(BASE + route);
    const slug = '390_public_' + (route === '/' ? 'home' : route.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, ''));
    await audit(route, slug);
  }

  if (ONLY) {
    const extraW = Number((process.argv.find((arg) => arg.startsWith('--w=')) || '').split('=')[1] || 0);
    const widths = [390, 768].concat(extraW ? [extraW] : []);
    for (const w of widths) {
      await viewport(w, w < 600 ? 844 : 1024);
      await goto(BASE + ONLY);
      if (MEASURE && w === 390) {
        const out = await evaluate(MEASURE);
        console.log('\n== measure @390 ==');
        console.log(JSON.stringify(out, null, 1));
      }
      if (SCROLL_Y) { await evaluate(`window.scrollTo(0, ${SCROLL_Y})`); await sleep(900); }
      const slug = (w === 390 ? 'only_' : 'only_' + w + '_') + ONLY.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') + (SCROLL_Y ? '_y' + SCROLL_Y : '');
      await audit(ONLY + ' @' + w, slug);
    }
    await viewport(390, 844);
  }

  console.log('\n== Tablet 768x1024 ==');
  await viewport(768, 1024);
  for (const route of tabletRoutes) {
    await goto(BASE + route);
    const slug = '768_' + route.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '');
    await audit(route, slug);
  }

  console.log(`\nscreenshots: ${SHOTS}`);
  ws.close();
  chrome.kill();
  fs.rmSync(profile, { recursive: true, force: true });
})().catch((error) => { console.error('AUDIT FAILED:', error.message); process.exitCode = 1; });
