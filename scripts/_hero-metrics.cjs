/**
 * Dumps computed typography + geometry of the landing hero so the local build
 * can be matched to a reference (local or live) exactly.
 *
 * Usage: set BASE=https://ainossuite.com && node scripts/_hero-metrics.cjs [width]
 * Output: _hero-metrics-<host>.json
 */

const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = (process.env.BASE || 'http://127.0.0.1:3000').replace(/\/$/, '');
const width = Number(process.argv[2] || 1440);
const height = Number(process.argv[3] || 900);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function freePort() {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
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
    } else if (message.method && listeners.has(message.method)) {
      listeners.get(message.method)(message.params, message.sessionId);
    }
  });

  const ready = new Promise((resolve) => ws.addEventListener('open', resolve));
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      nextId += 1;
      pending.set(nextId, { resolve, reject });
      ws.send(JSON.stringify({ id: nextId, method, params, sessionId }));
    });

  return { ready, send, on: (method, fn) => listeners.set(method, fn) };
}

const MEASURE = `(() => {
  const round = (n) => Math.round(n * 100) / 100;
  const info = (el, tag) => {
    if (!el) return { tag, missing: true };
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      tag,
      text: (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 70),
      fontSize: cs.fontSize,
      lineHeight: cs.lineHeight,
      letterSpacing: cs.letterSpacing,
      fontWeight: cs.fontWeight,
      color: cs.color,
      width: round(r.width),
      height: round(r.height),
      top: round(r.top + window.scrollY),
      left: round(r.left),
      marginTop: cs.marginTop,
      maxWidth: cs.maxWidth,
      padding: cs.padding,
      gap: cs.gap,
    };
  };

  const h1 = document.querySelector('h1');
  const hero = h1 ? h1.closest('section') : document.querySelector('section');
  const pill = hero ? hero.querySelector('a') : null;
  const sub = h1 && h1.nextElementSibling ? h1.nextElementSibling : null;
  const form = hero ? hero.querySelector('form') : null;
  const input = form ? form.querySelector('input') : null;
  const submit = form ? form.querySelector('button') : null;

  // trust badges: leaf blocks whose text starts with a known label
  const labels = ['Secure & Reliable', 'Quick Setup', 'Modular by design', 'Dedicated Support'];
  const badgeTexts = [...(hero || document).querySelectorAll('p, span, div')].filter((el) => {
    const t = (el.textContent || '').trim();
    return labels.some((l) => t === l) && el.children.length === 0;
  });
  const badges = badgeTexts.map((el) => {
    const item = el.parentElement && el.parentElement.parentElement;
    return {
      label: el.textContent.trim(),
      labelSize: getComputedStyle(el).fontSize,
      labelWeight: getComputedStyle(el).fontWeight,
      descSize: el.nextElementSibling ? getComputedStyle(el.nextElementSibling).fontSize : null,
      itemWidth: item ? round(item.getBoundingClientRect().width) : null,
      rowGap: item && item.parentElement ? getComputedStyle(item.parentElement).gap : null,
    };
  });

  // orbit: square container holding the rings
  const svgs = [...(hero || document).querySelectorAll('svg')];
  let orbit = null;
  for (const svg of svgs) {
    const circles = svg.querySelectorAll('circle');
    if (circles.length >= 3) {
      const host = svg.parentElement;
      const r = host.getBoundingClientRect();
      orbit = { width: round(r.width), height: round(r.height), left: round(r.left), top: round(r.top + window.scrollY) };
      break;
    }
  }

  // center disc = the element whose only child is the wordmark image
  let centerDisc = null;
  for (const img of (hero || document).querySelectorAll('img')) {
    if (/wordmark/i.test(img.getAttribute('src') || '')) {
      const disc = img.parentElement;
      const r = disc.getBoundingClientRect();
      centerDisc = { width: round(r.width), height: round(r.height), padding: getComputedStyle(disc).padding };
      break;
    }
  }

  // satellite circles: white round hosts containing a gradient child
  const satellites = [];
  for (const el of (hero || document).querySelectorAll('div')) {
    const cs = getComputedStyle(el);
    if (!/^rgb/.test(cs.borderRadius) && !/px|%/.test(cs.borderRadius)) continue;
    const r = el.getBoundingClientRect();
    const parentTransform = el.parentElement ? getComputedStyle(el.parentElement).transform : '';
    if (r.width === r.height && r.width >= 36 && r.width <= 110 && el.children.length === 1) {
      satellites.push({ size: round(r.width), radius: cs.borderRadius, transform: parentTransform ? 'parent-transformed' : '' });
    }
  }

  return {
    viewport: { width: window.innerWidth, heroTop: hero ? round(hero.getBoundingClientRect().top + window.scrollY) : null, heroHeight: hero ? round(hero.getBoundingClientRect().height) : null },
    h1: info(h1, 'h1'),
    subtitle: info(sub, 'subtitle'),
    pill: info(pill && pill.tagName === 'A' ? pill : null, 'pill'),
    form: info(form, 'form'),
    input: info(input, 'input'),
    submit: info(submit, 'submit'),
    badges,
    orbit,
    centerDisc,
    satellites: satellites.slice(0, 12),
  };
})()`;

async function main() {
  const port = await freePort();
  const profile = path.join(os.tmpdir(), `ainos-metrics-${Date.now()}`);
  const child = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    '--disable-gpu',
    '--no-first-run',
    '--hide-scrollbars',
    'about:blank',
  ]);

  try {
    let endpoint;
    for (let i = 0; i < 60 && !endpoint; i += 1) {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/json/version`);
        if (res.ok) endpoint = (await res.json()).webSocketDebuggerUrl;
      } catch {
        await wait(250);
      }
    }
    if (!endpoint) throw new Error('chrome did not start');

    const cdp = connect(endpoint);
    await cdp.ready;
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false }, sessionId);

    let loaded = false;
    cdp.on('Page.loadEventFired', (params, sid) => {
      if (sid === sessionId) loaded = true;
    });
    await cdp.send('Page.navigate', { url: `${BASE}/` }, sessionId);
    for (let i = 0; i < 200 && !loaded; i += 1) await wait(100);
    await wait(4000);

    const result = await cdp.send(
      'Runtime.evaluate',
      { expression: MEASURE, returnByValue: true, awaitPromise: true },
      sessionId,
    );

    const host = BASE.replace(/^https?:\/\//, '').replace(/[^a-z0-9.]+/gi, '-');
    const outFile = path.join(__dirname, '..', `_hero-metrics-${host}.json`);
    fs.writeFileSync(outFile, JSON.stringify(result.result.value, null, 2));
    console.log('wrote', path.basename(outFile));
  } finally {
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
  }
}

main().catch((error) => {
  console.error('METRICS_ERROR', error.message);
  process.exitCode = 1;
});