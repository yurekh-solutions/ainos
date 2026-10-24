// Confirms the icon set is actually served and advertised in <head>.
const BASE = process.env.QA_BASE || 'http://localhost:3007';

(async () => {
  const assets = ['/favicon.ico', '/icon.png', '/apple-icon.png'];
  for (const asset of assets) {
    const res = await fetch(BASE + asset);
    const buf = Buffer.from(await res.arrayBuffer());
    console.log(`${asset} -> ${res.status} ${res.headers.get('content-type')} ${buf.length} bytes first=${buf.subarray(0, 4).toString('hex')}`);
  }

  const html = await (await fetch(BASE + '/')).text();
  const links = html.match(/<link[^>]+rel="(?:icon|apple-touch-icon|shortcut icon)"[^>]*>/g) || [];
  console.log('head icon tags:');
  for (const link of links) console.log('  ' + link);
})();
