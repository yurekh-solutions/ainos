// Poll the 4 previously-404 pages until they flip to 307 (deployed) or timeout.
// 404 = still old build; 307 = new build live (auth-gated); 200 = live public.
(async () => {
  const base = 'https://ainos-ywu0.onrender.com';
  const probes = ['/marketing/events', '/marketing/surveys', '/ecommerce', '/point-of-sale'];
  const deadline = Date.now() + 8 * 60 * 1000; // 8 min
  let attempt = 0;
  while (Date.now() < deadline) {
    attempt++;
    const results = [];
    let allLive = true;
    for (const p of probes) {
      try {
        const r = await fetch(base + p, { redirect: 'manual', signal: AbortSignal.timeout(60000) });
        results.push(`${p}=${r.status}`);
        if (r.status === 404) allLive = false;
      } catch (e) { results.push(`${p}=ERR`); allLive = false; }
    }
    console.log(`[attempt ${attempt}] ${new Date().toLocaleTimeString()} :: ${results.join('  ')}`);
    if (allLive) { console.log('\n>>> DEPLOYED: no more 404s. Latest code is live.'); break; }
    await new Promise(res => setTimeout(res, 45000));
  }
  console.log('\nDone polling.');
})();
