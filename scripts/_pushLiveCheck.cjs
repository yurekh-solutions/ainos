// Check whether commit 64634f0 (15 new API routes, Oct 24) is live on Render.
// 401/405 = route exists => deployed. 404 = stale deploy.
(async () => {
  const eps = ['/api/attendance', '/api/deals', '/api/credit-notes', '/api/warehouses', '/api/helpdesk', '/api/stock', '/api/bank-accounts', '/api/leaves'];
  for (const ep of eps) {
    try {
      const r = await fetch('https://ainos-ywu0.onrender.com' + ep, { redirect: 'manual', signal: AbortSignal.timeout(60000) });
      console.log(ep, '->', r.status);
    } catch (e) {
      console.log(ep, '-> ERR', e.message);
    }
  }
})();
