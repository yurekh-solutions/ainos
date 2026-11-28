/* eslint-disable @typescript-eslint/no-require-imports -- Node build script, not app code. */
// Runs before `next dev`.
//
// Two problems this guards against on an OneDrive-synced checkout:
//  1. A second `npm run dev` wipes .next underneath the first server, which then
//     dies with ENOENT (.next\dev\server\app\page.js) until it is restarted.
//  2. `rmdir /s /q .next` silently fails on OneDrive placeholders.
const fs = require('fs');
const net = require('net');
const path = require('path');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 3000);

function clearNext() {
  try {
    fs.rmSync(path.join(root, '.next'), { recursive: true, force: true, maxRetries: 10, retryDelay: 400 });
    console.log('Cleared .next');
  } catch (error) {
    // A locked cache is not fatal: Next rebuilds whatever is missing.
    console.warn(`Could not fully clear .next (${error.code}); continuing`);
  }
}

const probe = net.connect({ port, host: '127.0.0.1' });
probe.setTimeout(1500);

probe.on('connect', () => {
  probe.destroy();
  console.error(`Port ${port} is already in use, so a dev server is probably running.`);
  console.error('Stop it first (it owns .next), then run npm run dev again.');
  process.exit(1);
});

const startFresh = () => {
  probe.destroy();
  clearNext();
};

probe.on('timeout', startFresh);
probe.on('error', startFresh);
