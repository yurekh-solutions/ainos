/**
 * Captures full-page phone-width screenshots for visual review.
 *
 * Usage: node scripts/_shots.cjs --cookie=_mobile-cookie.txt / /features /pricing
 * Output: _shots/<slug>.png
 */

const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = (process.env.BASE || 'http://127.0.0.1:3000').replace(/\/$/, '');
const argv = process.argv.slice(2);
const flags = Object.fromEntries(
  argv
    .filter((arg) => arg.startsWith('--'))
    .map((arg) => {
      const [key, ...rest] = arg.replace(/^--/, '').split('=');
      return [key, rest.join('=')];
    }),
);
const routes = argv.filter((arg) => !arg.startsWith('--'));
const width = Number(flags.widths || flags.width || 390);
const height = Number(flags.height || 844);
const cookieFile = flags.cookie;

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

async function main() {
  if (!routes.length) {
    console.error('pass at least one route');
    process.exit(1);
  }

  const outDir = path.join(__dirname, '..', '_shots');
  fs.mkdirSync(outDir, { recursive: true });

  const port = await freePort();
  const profile = path.join(os.tmpdir(), `ainos-shots-${Date.now()}`);
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
    await cdp.send('Network.enable', {}, sessionId);

    if (cookieFile) {
      const raw = fs.readFileSync(cookieFile, 'utf8').trim();
      for (const pair of raw.split(';')) {
        const index = pair.indexOf('=');
        if (index < 1) continue;
        await cdp.send(
          'Network.setCookie',
          {
            name: pair.slice(0, index).trim(),
            value: pair.slice(index + 1).trim(),
            domain: '127.0.0.1',
            path: '/',
            httpOnly: true,
            sameSite: 'Lax',
          },
          sessionId,
        );
      }
    }

    for (const route of routes) {
      await cdp.send(
        'Emulation.setDeviceMetricsOverride',
        { width, height, deviceScaleFactor: 2, mobile: width < 768 },
        sessionId,
      );

      let loaded = false;
      cdp.on('Page.loadEventFired', (params, sid) => {
        if (sid === sessionId) loaded = true;
      });
      await cdp.send('Page.navigate', { url: `${BASE}${route}` }, sessionId);
      for (let i = 0; i < 150 && !loaded; i += 1) await wait(100);
      await wait(Number(flags.settle || 900));

      const shot = await cdp.send(
        'Page.captureScreenshot',
        { format: 'png', captureBeyondViewport: false },
        sessionId,
      );

      const name = (route === '/' ? 'home' : route.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-')) + '.png';
      fs.writeFileSync(path.join(outDir, name), Buffer.from(shot.data, 'base64'));
      console.log('shot', name);
    }
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
  console.error('SHOT_ERROR', error.message);
  process.exitCode = 1;
});