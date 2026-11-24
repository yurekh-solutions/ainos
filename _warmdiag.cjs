// Read-only diagnostic: is the Render free instance actually being kept awake,
// and what does a visitor receive when it is asleep?
// Run: node _warmdiag.cjs
const URLS = {
  repo: 'https://api.github.com/repos/yurekh-solutions/ainos',
  runs: 'https://api.github.com/repos/yurekh-solutions/ainos/actions/workflows/warm-loop.yml/runs?per_page=12',
  ping: 'https://ainossuite.com/api/ping',
  scraper: 'https://ainos-gst-scraper.onrender.com/api/v1/health',
  extractor: 'https://ainos-template-extractor.onrender.com/api/v1/health',
  root: 'https://ainossuite.com/',
};

async function get(label, url) {
  const start = Date.now();
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'ainos-warmdiag' } });
    const body = await res.text();
    const ms = Date.now() - start;
    console.log(`\n[${label}] ${res.status} in ${ms}ms  ct=${res.headers.get('content-type')}`);
    const isRenderSplash = /Render|APPLICATION LOADING|WAKING UP|ALLOCATING COMPUTE/i.test(body);
    console.log(`  render_interstitial=${isRenderSplash}`);
    console.log(`  body: ${body.replace(/\s+/g, ' ').slice(0, 220)}`);
    return { status: res.status, ms, body };
  } catch (e) {
    console.log(`\n[${label}] FAILED after ${Date.now() - start}ms: ${e.message}`);
    return { status: 0, ms: Date.now() - start, body: '' };
  }
}

(async () => {
  const repo = await get('repo-visibility', URLS.repo);
  if (repo.body) {
    const j = JSON.parse(repo.body);
    console.log(`  private=${j.private} actions_url=${j.actions_url}`);
  }

  const runs = await get('keep-alive-runs', URLS.runs);
  if (runs.body && runs.status === 200) {
    const j = JSON.parse(runs.body);
    console.log(`  total_count=${j.total_count}`);
    for (const r of (j.workflow_runs || []).slice(0, 12)) {
      console.log(`  ${r.created_at}  event=${r.event}  status=${r.status}  conclusion=${r.conclusion}`);
    }
  }

  for (let i = 1; i <= 3; i++) {
    await get(`ping#${i}`, URLS.ping);
    await new Promise(r => setTimeout(r, 3000));
  }
  // The two Flask helpers are what the warm loop also pings; if either answers
  // non-200 the loop logs a warning, so their real status matters here.
  await get('gst-scraper', URLS.scraper);
  await get('template-extractor', URLS.extractor);
  await get('root', URLS.root);
})();
