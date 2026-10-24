/* Dead-link audit: builds the real route set from src/app and checks every internal link. */
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

const files = walk(appDir);

// Build route set from page.tsx / route.ts files
const routes = new Set();
for (const file of files) {
  if (!/^(page|route)\.(tsx?|jsx?)$/.test(path.basename(file))) continue;
  let rel = path.relative(appDir, path.dirname(file)).split(path.sep).join('/');
  // strip route groups like (dashboard)
  rel = rel
    .split('/')
    .filter((seg) => !(seg.startsWith('(') && seg.endsWith(')')))
    .join('/');
  const isApi = path.basename(file).startsWith('route.');
  if (isApi) {
    routes.add('/' + rel.replace(/^$/, ''));
  } else {
    routes.add('/' + rel);
  }
}

// Expand dynamic segments into a sample value so we can match /x/abc/edit patterns
const dynamicMatchers = [];
for (const route of routes) {
  if (route.includes('[')) {
    const pattern = route.replace(/\[\[?\.\.\.[^\]]+\]\]?/g, '.*').replace(/\[[^\]]+\]/g, '[^/]+');
    dynamicMatchers.push({ route, re: new RegExp('^' + pattern + '$') });
  }
}
const staticRoutes = new Set([...routes].filter((r) => !r.includes('[')));

function routeExists(href) {
  const clean = href.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  if (staticRoutes.has(clean)) return true;
  return dynamicMatchers.some((m) => m.re.test(clean));
}

// Collect internal hrefs from source
const srcDir = path.join(root, 'src');
const srcFiles = walk(srcDir).filter((f) => /\.(tsx?|jsx?)$/.test(f));
const linkRe = /(?:href|router\.(?:push|replace)|redirect)\s*[=(]\s*[`'"]([^`'"]+)[`'"]/g;
const refs = new Map();

for (const file of srcFiles) {
  const text = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = linkRe.exec(text)) !== null) {
    let href = match[1];
    if (!href.startsWith('/')) continue;
    if (href.startsWith('/api/')) continue;
    // skip template literals with interpolation
    if (href.includes('${')) {
      // keep the literal prefix up to the first interpolation so /x/${id}/edit becomes /x/ID/edit
      href = href.replace(/\$\{[^}]+\}/g, 'SAMPLE');
    }
    if (!refs.has(href)) refs.set(href, new Set());
    refs.get(href).add(path.relative(root, file));
  }
}

const missing = [];
for (const [href, sources] of refs) {
  if (!routeExists(href)) missing.push({ href, sources: [...sources] });
}

// Navigation targets specifically
const navFile = path.join(srcDir, 'components', 'layout', 'navigation.ts');
const navText = fs.readFileSync(navFile, 'utf8');
const navHrefs = [...navText.matchAll(/href:\s*'([^']+)'/g)].map((m) => m[1]);
const badNav = navHrefs.filter((h) => !routeExists(h));

console.log(`routes: ${routes.size} (static ${staticRoutes.size}, dynamic ${dynamicMatchers.length})`);
console.log(`internal link targets: ${refs.size}`);
console.log(`\n=== NAV LINKS (${navHrefs.length}) ===`);
console.log(badNav.length ? `BROKEN: ${badNav.join(', ')}` : 'all nav links resolve');
console.log(`\n=== BROKEN LINKS (${missing.length}) ===`);
for (const m of missing.sort((a, b) => a.href.localeCompare(b.href))) {
  console.log(`${m.href}  <-  ${m.sources.slice(0, 3).join(' | ')}`);
}
