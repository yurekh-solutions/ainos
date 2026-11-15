// Is the business-card scanner worth keeping? This answers it with rows, not
// with a feeling.
//
//   node --env-file=.env scripts/_cardValueReport.cjs            -> last 90 days
//   node --env-file=.env scripts/_cardValueReport.cjs 30         -> last 30 days
//   node --env-file=.env scripts/_cardValueReport.cjs 365 --by-company
//   node --env-file=.env scripts/_cardValueReport.cjs 30 --company=<id> --json
//
// It reads the audit trail the scanner writes: one row per card read, one per
// card saved. Nothing else in the product counts those, so without them the
// question "do people use it" has no answer.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DAYS = Number(process.argv.find((a) => /^\d+$/.test(a)) || 90);
const BY_COMPANY = process.argv.includes('--by-company');
// Machine-readable output, so the test harness can assert on the funnel and a
// dashboard can chart it without parsing a report meant for eyes.
const AS_JSON = process.argv.includes('--json');
// One tenant's funnel only - what a seller asks about, and what keeps a
// company's numbers out of another company's report.
const COMPANY = (process.argv.find((a) => a.startsWith('--company=')) || '').replace('--company=', '') || null;
const SINCE = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);

const pct = (part, whole) => (whole ? `${((part / whole) * 100).toFixed(0)}%` : '—');
const pad = (label) => `  ${String(label).padEnd(34)}`;

async function main() {
  const rows = await prisma.auditLog.findMany({
    where: {
      entity: 'business_card',
      createdAt: { gte: SINCE },
      ...(COMPANY ? { companyId: COMPANY } : {}),
    },
    orderBy: { createdAt: 'asc' },
    select: { companyId: true, entityId: true, action: true, changes: true, createdAt: true },
  });

  if (!AS_JSON) console.log(`\n=== BUSINESS CARD SCANNER — last ${DAYS} days ===`);
  if (!rows.length) {
    if (AS_JSON) {
      console.log(JSON.stringify({ days: DAYS, company: COMPANY, noData: true, groups: [] }));
      return;
    }
    console.log('  No card activity recorded yet.');
    console.log('  Either nobody has used the scanner in this window, or the events');
    console.log('  were only added in this version — earlier scans left no trail.');
    return;
  }

  const first = rows[0].createdAt;
  const days = Math.max(1, Math.round((Date.now() - first.getTime()) / 86400000));
  if (!AS_JSON) console.log(`  trail starts ${first.toISOString().slice(0, 10)} (${days} day(s) of data)`);

  const groups = BY_COMPANY
    ? [...new Set(rows.map((r) => r.companyId || '(no company)'))].map((id) => ({
        key: id, rows: rows.filter((r) => (r.companyId || '(no company)') === id),
      }))
    // A scoped run must say so; calling one tenant's funnel "all companies"
    // is how a report starts being misread.
    : [{ key: COMPANY || 'all companies', rows }];

  const groupsOut = [];
  for (const group of groups) {
    const scans = group.rows.filter((r) => r.action === 'scanned');
    const saves = group.rows.filter((r) => r.action !== 'scanned');
    const created = saves.filter((r) => r.action === 'created');
    const updated = saves.filter((r) => r.action === 'updated');
    const unchanged = saves.filter((r) => r.action === 'unchanged');

    const withGstin = saves.filter((r) => r.changes?.hasGstin === true);
    const checks = { verified: 0, attention: 0, unchecked: 0 };
    for (const r of saves) {
      const c = r.changes?.check;
      if (c && c in checks) checks[c] += 1;
    }

    // The question that actually decides the feature: did a scanned card ever
    // turn into money? Saved cards are logged against the customer id, so the
    // invoices sitting under those ids are the answer.
    const customerIds = [...new Set(saves.map((r) => r.entityId).filter((id) => id && id !== 'scan'))];
    let bills = [];
    let billTotal = 0;
    if (customerIds.length) {
      const [found, sum] = await Promise.all([
        prisma.invoice.findMany({
          where: { customerId: { in: customerIds }, createdAt: { gte: first } },
          select: { customerId: true, totalAmount: true },
        }),
        prisma.invoice.aggregate({
          where: { customerId: { in: customerIds }, createdAt: { gte: first } },
          _sum: { totalAmount: true },
        }),
      ]);
      bills = found;
      billTotal = sum._sum.totalAmount || 0;
    }
    const billed = new Set(bills.map((b) => b.customerId));

    groupsOut.push({
      key: group.key,
      scans: scans.length,
      saves: saves.length,
      created: created.length,
      updated: updated.length,
      unchanged: unchanged.length,
      withGstin: withGstin.length,
      verified: checks.verified,
      attention: checks.attention,
      unchecked: checks.unchecked,
      contacts: customerIds.length,
      billedCustomers: billed.size,
      invoices: bills.length,
      billedValue: Number(billTotal.toFixed(2)),
    });

    if (AS_JSON) continue;
    console.log(`\n--- ${group.key} ---`);
    console.log(`${pad('cards scanned')} ${scans.length}`);
    console.log(`${pad('cards saved into Customers')} ${saves.length}  (${pct(saves.length, scans.length)} of scans)`);
    console.log(`${pad('  new customers')} ${created.length}`);
    console.log(`${pad('  gaps filled in existing')} ${updated.length}`);
    console.log(`${pad('  already on file')} ${unchanged.length}  (${pct(unchanged.length, saves.length)} repeats — dedupe working)`);
    console.log(`${pad('saved cards carrying a GSTIN')} ${withGstin.length}  (${pct(withGstin.length, saves.length)})`);
    console.log(`${pad('GSTN: matched a known number')} ${checks.verified}`);
    console.log(`${pad('GSTN: needs a look')} ${checks.attention}`);
    console.log(`${pad('GSTN: never seen here')} ${checks.unchecked}`);

    if (!customerIds.length) { console.log(`${pad('billed later')} nothing to measure yet`); continue; }
    console.log(`${pad('contacts from cards')} ${customerIds.length}`);
    console.log(`${pad('...that got billed afterwards')} ${billed.size}  (${pct(billed.size, customerIds.length)})`);
    console.log(`${pad('...invoices raised on them')} ${bills.length}`);
    console.log(`${pad('...total value of those bills')} INR ${billTotal.toFixed(2)}`);
  }

  if (AS_JSON) {
    console.log(JSON.stringify({
      days: DAYS, company: COMPANY, trailStart: first.toISOString(), trailDays: days, groups: groupsOut,
    }));
    return;
  }

  console.log('\n  Reading it: a high saved-to-billed rate means the scanner is');
  console.log('  feeding revenue. Lots of scans and few saves means the read is');
  console.log('  not trusted, and the fix is the scan quality, not the button.');
}

main()
  .catch((e) => { console.error('REPORT FAILED:', e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
