const https = require('https');

const BASE = process.argv[2] || 'https://ainos-ywu0.onrender.com';
const email = process.argv[3] || 'probe-not-a-user@example.com';

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const url = new URL(BASE + path);
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
        timeout: 60000,
      },
      (res) => {
        let out = '';
        res.on('data', (c) => (out += c));
        res.on('end', () => resolve({ status: res.statusCode, body: out.slice(0, 600) }));
      },
    );
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    https
      .get({ hostname: url.hostname, path: url.pathname + url.search, timeout: 60000 }, (res) => {
        let out = '';
        res.on('data', (c) => (out += c));
        res.on('end', () => resolve({ status: res.statusCode, len: out.length }));
      })
      .on('error', reject);
  });
}

(async () => {
  console.log('BASE =', BASE);
  for (const p of ['/auth/forgot-password', '/auth/reset-password', '/auth/signin']) {
    try {
      const r = await get(p);
      console.log('GET', p, '->', r.status, 'bytes=' + r.len);
    } catch (e) {
      console.log('GET', p, 'ERR', e.message);
    }
  }
  try {
    const r = await post('/api/auth/forgot-password', { email });
    console.log('POST /api/auth/forgot-password ->', r.status, r.body);
  } catch (e) {
    console.log('POST forgot-password ERR', e.message);
  }
})();
