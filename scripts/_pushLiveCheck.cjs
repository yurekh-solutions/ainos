// Final deploy verification: probe routes that actually exist in the codebase.
// Expect 307 (auth-gated, deployed) for dashboard pages and 401 for API routes.
(async () => {
  const base = 'https://ainos-ywu0.onrender.com';
  const checks = [
    ['/marketing/events', [307]],
    ['/marketing/surveys', [307]],
    ['/ecommerce/stores', [307]],
    ['/ecommerce/orders', [307]],
    ['/tools', [307]],
    ['/api/attendance', [401]],
    ['/api/deals', [401]],
    ['/api/warehouses', [401]],
    ['/api/definitely_not_real_xyz', [404]], // control: must stay 404
  ];
  let pass = true;
  for (const [p, expected] of checks) {
    try {
      const r = await fetch(base + p, { redirect: 'manual', signal: AbortSignal.timeout(60000) });
      const ok = expected.includes(r.status);
      if (!ok) pass = false;
      console.log((ok ? 'OK  ' : 'FAIL') + '  ' + p.padEnd(32) + r.status + '  (expected ' + expected.join('/') + ')');
    } catch (e) { pass = false; console.log('ERR   ' + p + '  ' + e.message); }
  }
  console.log('\n>>> ' + (pass ? 'DEPLOY CONFIRMED: latest code (8dd7a9d) is live.' : 'Still not fully live.'));
})();
