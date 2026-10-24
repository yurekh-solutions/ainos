/**
 * Confirms the logo URL baked into auth mail actually resolves on the public
 * host (a Render free-tier service may need a cold-start warm-up first).
 */
const URLS = [
  'https://ainos-ywu0.onrender.com/ainos-alpha.png',
  'https://ainos-ywu0.onrender.com/ainos-wordmark.png',
];

(async () => {
  for (const url of URLS) {
    const started = Date.now();
    try {
      const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(90000) });
      const buf = Buffer.from(await res.arrayBuffer());
      const png = buf.subarray(0, 8).toString('hex') === '89504e470d0a1a0a';
      const dims = png && buf.length > 24 ? `${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)}` : 'not-png';
      console.log(`${res.status}  ${dims.padEnd(10)} ${String(buf.length).padStart(7)}B  ${Date.now() - started}ms  ${url}`);
    } catch (err) {
      console.log(`ERR   ${err.message}  ${url}`);
    }
  }
})();
