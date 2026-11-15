// Is the GSTIN check-digit algorithm in gstnFiling.ts actually right?
//
// The unit test builds its fixtures through gstinCheckChar() itself, so it can
// only ever agree with it - it proves nothing about the real world. That matters,
// because validateGstin() turns a mismatch into "Check digit looks like it
// should be X" on a tax document. If the rule is wrong, every real GSTIN gets a
// bogus warning and the seller learns to ignore the warnings that matter.
//
// The rule below is the one published by the GST System developer portal
// (developer.gstsystem.co.in/apiportal), reproduced in the Java/Python
// validators that were written against it: a Luhn-mod-36 double-add-dadd over
// '0123456789..ABC..XYZ', applied right to left starting with factor 2.
//
//   node scripts/_gstinChecksumProbe.cjs
const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const A36 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const val = (ch) => A36.indexOf(String(ch).toUpperCase());
const mod = (n, m) => ((n % m) + m) % m;

// What is shipped today: weighted primes, mod 36.
const SHIPPED = (s) => {
  const W = [1, 3, 7, 9, 11, 13, 17, 19, 23, 29, 37, 41, 43, 47];
  let sum = 0;
  for (let i = 0; i < 14; i++) { const v = val(s[i]); if (v < 0) return ''; sum += v * W[i]; }
  return A36[mod(36 - (sum % 36), 36)];
};

// The portal-published rule. Integer division on purpose - that is the
// double-add-dadd step, not a rounding accident.
const OFFICIAL = (s) => {
  const input = s.slice(0, 14).toUpperCase();
  if (input.length !== 14 || [...input].some((c) => val(c) < 0)) return '';
  let factor = 2, sum = 0;
  for (let i = input.length - 1; i >= 0; i--) {
    let digit = factor * val(input[i]);
    factor = factor === 2 ? 1 : 2;
    digit = Math.floor(digit / 36) + (digit % 36);
    sum += digit;
  }
  return A36[mod(36 - (sum % 36), 36)];
};

const RULES = { shipped: SHIPPED, official: OFFICIAL };

// Published as valid GSTINs by independent validators written against the GSTN
// algorithm: the developer-portal-derived Java/Python gist, and the
// SGFGOV/sgf-gstin-validator npm package. Each is a number its authors claim
// validates, which is exactly the evidence needed to tell two rules apart.
const CONTROLS = ['09AAAUP8175A1ZG', '12AAACI1681G1Z0', '47AAACI1681G1Z0'];

// Invented by the harnesses and the demo seed - they cannot vote on anything.
const SYNTHETIC = /(AAAAA|BBBBB|AABCV|AAACS|1234A1Z|5678K1Z|0000A1Z|99999|UP8175)/;
const SHAPE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

// Fixture hygiene: any invented GSTIN hard-coded in a script or a test fails its
// own check character, so the scanner now labels it "looks misread". That is
// correct behaviour, but it makes a demo look like the product is complaining.
// These are the numbers to re-mint through OFFICIAL() if that matters.
function fixtureSweep() {
  const dirs = [path.join(__dirname), path.join(__dirname, '..', 'src', 'lib', '__tests__')];
  const rx = /\b\d{2}[A-Z]{5}\d{4}[A-Z][0-9A-Z]Z[0-9A-Z]\b/g;
  const bad = new Map();
  for (const dir of dirs) {
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      if (!e.isFile() || !/\.(cjs|ts|js)$/.test(e.name)) continue;
      const text = fs.readFileSync(path.join(dir, e.name), 'utf8');
      for (const g of new Set(text.match(rx) || [])) {
        if (CONTROLS.includes(g)) continue;
        const want = OFFICIAL(g.slice(0, 14));
        if (want && want !== g[14]) {
          if (!bad.has(g)) bad.set(g, new Set());
          bad.get(g).add(e.name);
        }
      }
    }
  }
  console.log(`\n  fixture GSTINs that fail their own check character: ${bad.size}`);
  console.log('  (expected - they are invented numbers. Re-mint the tail if a demo'
    + '\n   should not show the "looks misread" pill.)');
  for (const [g, where] of bad) {
    console.log(`      ${g} -> ${OFFICIAL(g.slice(0, 14))}   in ${[...where].slice(0, 3).join(', ')}`);
  }
}

async function main() {
  const [cached, customers] = await Promise.all([
    prisma.gstLookupCache.findMany({ select: { gstNumber: true }, take: 5000 }),
    prisma.customer.findMany({ where: { gstNumber: { not: null } }, select: { gstNumber: true }, take: 5000 }),
  ]);

  const usable = (g) => {
    const s = String(g || '').trim().toUpperCase();
    return SHAPE.test(s) && !SYNTHETIC.test(s) ? s : null;
  };
  const fromCache = [...new Set(cached.map(usable).filter(Boolean))];
  const fromCustomers = [...new Set(customers.map(usable).filter(Boolean))].filter((g) => !fromCache.includes(g));
  const samples = [...new Set([...CONTROLS, ...fromCache, ...fromCustomers])];

  console.log(`\n=== GSTIN CHECK-DIGIT PROBE ===`);
  console.log(`  published controls : ${CONTROLS.length}`);
  console.log(`  from gst_lookup_cache (portal reads): ${fromCache.length}`);
  console.log(`  from customers (typed/scanned)      : ${fromCustomers.length}`);

  const tally = { shipped: { ok: 0, bad: [] }, official: { ok: 0, bad: [] } };
  for (const g of samples) {
    for (const [name, fn] of Object.entries(RULES)) {
      if (fn(g.slice(0, 14)) === g[14]) tally[name].ok += 1;
      else tally[name].bad.push({ g, wants: fn(g.slice(0, 14)) });
    }
  }

  const controlPass = (name) => CONTROLS.every((g) => RULES[name](g.slice(0, 14)) === g[14]);
  for (const name of Object.keys(RULES)) {
    const t = tally[name];
    console.log(`\n  ${name.padEnd(9)} ${t.ok}/${samples.length} agree   controls: ${CONTROLS.filter((g) => RULES[name](g.slice(0, 14)) === g[14]).length}/${CONTROLS.length} PASS`);
    for (const g of CONTROLS) {
      console.log(`      control ${g} -> ${name} computes ${RULES[name](g.slice(0, 14))} ${RULES[name](g.slice(0, 14)) === g[14] ? 'MATCH' : 'no match'}`);
    }
    if (name === 'official') {
      for (const b of t.bad.filter((x) => !CONTROLS.includes(x.g))) {
        const tag = fromCache.includes(b.g) ? 'cache' : 'customer';
        console.log(`      mismatch [${tag}] ${b.g.slice(0, 2)}${'•'.repeat(11)}${b.g.slice(13)} - rule wants ${b.wants}`);
      }
    }
  }

  console.log(`\n  ${controlPass('official') && !controlPass('shipped')
    ? 'The shipped rule is wrong: it cannot even reproduce the published sample.'
    : ' inconclusive - check the controls above before changing anything.'}`);
  console.log('  Note: a mismatch on customer rows means that stored number is not');
  console.log('  a valid GSTIN - it does not say the rule is wrong.');
  fixtureSweep();
}

main()
  .catch((e) => { console.error('PROBE FAILED:', e.message || e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
