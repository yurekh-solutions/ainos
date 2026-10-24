/* API coverage audit: every /api/... path used by the UI must exist as a route. */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const appDir = path.join(root, 'src', 'app');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const apiRoutes = new Set();
for (const file of walk(appDir)) {
  if (path.basename(file) !== 'route.ts' && path.basename(file) !== 'route.js') continue;
  let rel = path.relative(path.join(appDir, 'api'), path.dirname(file)).split(path.sep).join('/');
  rel = rel.split('/').filter((s) => !(s.startsWith('(') && s.endsWith(')'))).join('/');
  apiRoutes.add('/api/' + rel);
}

const dynamic = [];
for (const r of apiRoutes) {
  if (r.includes('[')) dynamic.push(new RegExp('^' + r.replace(/\[[^\]]+\]/g, '[^/]+') + '$'));
}

function apiExists(p) {
  const clean = p.split('?')[0].replace(/\/+$/, '');
  if (apiRoutes.has(clean)) return true;
  return dynamic.some((re) => re.test(clean));
}

const srcFiles = walk(path.join(root, 'src')).filter((f) => /\.(tsx?|jsx?)$/.test(f));
const apiRe = /(?:fetch\(\s*[`'"]|from\s+[`'"])(\/api\/[^`'"]+)/g;
const refs = new Map();

for (const file of srcFiles) {
  const text = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = apiRe.exec(text)) !== null) {
    let p = m[1];
    if (p.includes('${')) p = p.replace(/\$\{[^}]+\}/g, 'SAMPLE');
    if (!refs.has(p)) refs.set(p, new Set());
    refs.get(p).add(path.relative(root, file));
  }
}

const missing = [...refs.entries()].filter(([p]) => !apiExists(p));
console.log(`api routes: ${apiRoutes.size}`);
console.log(`referenced api paths: ${refs.size}`);
console.log(`\n=== MISSING API (${missing.length}) ===`);
for (const [p, files] of missing.sort((a, b) => a[0].localeCompare(b[0]))) {
  console.log(`${p}  <-  ${[...files].slice(0, 2).join(' | ')}`);
}
