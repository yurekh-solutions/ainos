// Route compile check for the new Odoo-parity apps.
// Run: node scripts/_routeCheck.cjs
const BASE = 'http://localhost:3000';

const routes = [
  '/rental',
  '/rental/new',
  '/rental/abc123/edit',
  '/approvals',
  '/approvals/new',
  '/approvals/abc123/edit',
  '/planning',
  '/planning/new',
  '/planning/abc123/edit',
  '/marketing/surveys',
  '/marketing/surveys/new',
  '/marketing/surveys/abc123/edit',
  '/marketing/surveys/abc123/respond',
  '/marketing/events',
  '/marketing/events/new',
  '/marketing/events/abc123/edit',
  '/marketing/events/abc123/register',
  '/finance/recurring-invoices',
  '/finance/recurring-invoices/new',
  '/finance/debit-notes',
  '/finance/debit-notes/new',
  '/finance/credit-notes',
  '/finance/bank-accounts',
  '/finance/daybook',
  '/finance/gst-reports',
  '/finance/reports',
  // Public share links: no sidebar, no session.
  '/s/abc123',
  '/e/abc123',
];

(async () => {
  let fail = 0;
  for (const route of routes) {
    const res = await fetch(BASE + route, { redirect: 'manual' });
    const ok = res.status === 307 || res.status === 200;
    if (!ok) fail += 1;
    console.log(`[${ok ? 'OK' : 'FAIL'}] ${res.status} ${route}`);
  }
  console.log(`\nroutes checked: ${routes.length}, failures: ${fail}`);
})();
