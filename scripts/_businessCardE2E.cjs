// End-to-end check for "scan a card, the data gets inserted".
//
// Drives POST /api/finance/business-cards/save over a real session and a real
// database, because the risky part of this feature is not the insert — it is
// what happens when the card turns out to be one the seller already has. Every
// case asserts against the rows in the table, not against what the route claims.
//
// Run: node --env-file=.env scripts/_businessCardE2E.cjs
// Add a card photo path as argv[2] to also push a real image through the
// vision scanner, which is the only leg that needs a working AI provider:
//   node --env-file=.env scripts/_businessCardE2E.cjs "C:\\temp\\card.png"
const fs = require('node:fs');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const LIVE_IMAGE = process.argv[2] || null;

const BASE = 'http://localhost:3000';
const STAMP = Date.now();
const EMAIL_A = `card_e2e_a${STAMP}@ainos.test`;
const EMAIL_B = `card_e2e_b${STAMP}@ainos.test`;
const PASSWORD = 'Card@Test123';
let jar = {};
let PASS = 0, FAIL = 0;
let COMPANY_A = null, COMPANY_B = null;

function ok(name, cond, detail = '') {
  if (cond) { PASS++; console.log(`  [OK]   ${name}${detail ? ' :: ' + detail : ''}`); }
  else { FAIL++; console.log(`  [FAIL] ${name}${detail ? ' :: ' + detail : ''}`); }
}

function merge(res) {
  for (const raw of (res.headers.getSetCookie?.() || [])) {
    const [pair] = raw.split(';'); const [k, ...v] = pair.split('=');
    if (k && v.length) jar[k.trim()] = v.join('=').trim();
  }
}
const cookie = () => Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ');
async function api(method, path, body) {
  const opts = { method, headers: { Cookie: cookie() }, redirect: 'manual' };
  if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  const res = await fetch(BASE + path, opts); merge(res);
  let data = null; try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

async function login(email) {
  jar = {};
  const csrf = await fetch(BASE + '/api/auth/csrf'); merge(csrf);
  const { csrfToken } = await csrf.json();
  const r = await fetch(BASE + '/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookie() },
    body: new URLSearchParams({ csrfToken, email, password: PASSWORD, callbackUrl: '/dashboard', json: 'true' }),
    redirect: 'manual',
  }); merge(r);
  const s = await api('GET', '/api/auth/session');
  return s.data?.user?.email === email;
}

async function provision(email, name) {
  const company = await prisma.company.create({
    data: {
      name, gstNumber: '27AAACS1234A1Z5', state: 'Maharashtra', email, phone: '9900000002',
      companyType: 'Private Limited', onboardingStatus: 'approved', createdBy: email,
      currency: 'INR', invoiceGen: 1, crmAccess: 1, subscriptionStatus: 'trialing',
    },
  });
  await prisma.user.create({
    data: {
      name: 'Card Tester', email, phone: '9900000002', password: await bcrypt.hash(PASSWORD, 10),
      role: 'owner', companyId: company.id, emailVerifiedAt: new Date(),
    },
  });
  return company.id;
}

const save = (fields) => api('POST', '/api/finance/business-cards/save', { fields });
const rowsFor = (companyId) => prisma.customer.findMany({ where: { companyId } });

// A card as the vision model hands it over: two numbers, one email, a GSTIN and
// an address with the pincode at the end.
const CARD = {
  name: 'Rakesh Verma',
  designation: 'Purchase Manager',
  company: 'Verma Textiles Pvt Ltd',
  phone: '+91 98200 12345 / 22 4567 8901',
  email: 'rakesh@vermatextiles.in',
  website: 'https://vermatextiles.in/',
  address: 'Plot 14, MIDC Phase II, Andheri East, Mumbai 400093',
  gstin: '27AABCV5678K1Z3',
};

// Each case needs its own person: the GSTIN and the number are the very keys
// the dedupe looks at, so reusing them would make every case match the insert
// from case 1 and the test would prove nothing.
let SEQ = 0;
function freshCard(over = {}) {
  SEQ += 1;
  const mobile = `98${String(SEQ).padStart(8, '0')}`;
  return {
    ...CARD,
    name: `${CARD.name} ${SEQ}`,
    email: `c${SEQ}.${CARD.email}`,
    phone: `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)} / 22 4567 8901`,
    gstin: `27AABCV${String(SEQ).padStart(4, '0')}K1Z3`,
    ...over,
  };
}
const mobileDigits = (phone) => String(phone || '').split('/')[0].replace(/\D/g, '').slice(-10);

async function case1_firstCard() {
  console.log('\n=== 1. A first card becomes a customer, GSTIN and all ===');
  const card = freshCard();
  const res = await save(card);
  ok('save accepted', res.status === 201 && res.data?.action === 'created', `${res.status} ${res.data?.action}`);
  const rows = await rowsFor(COMPANY_A);
  ok('exactly one customer exists', rows.length === 1, `count=${rows.length}`);
  const c = rows[0];
  ok('GSTIN written so the GST lookup can run on it', c?.gstNumber === card.gstin, c?.gstNumber);
  ok('state derived from the GSTIN code', c?.state === 'Maharashtra', c?.state);
  ok('pincode taken from the address', c?.pincode === '400093', c?.pincode);
  ok('the second number and the website are kept in notes',
    /Other numbers: 22 4567 8901/.test(c?.notes || '') && /Website: vermatextiles\.in/.test(c?.notes || ''), c?.notes);
  ok('designation saved', /Designation: Purchase Manager/.test(c?.notes || ''), c?.designation);
  return { card, row: c };
}

async function case2_rescanIsHarmless(card) {
  console.log('\n=== 2. The same card scanned twice ===');
  const res = await save({ ...card });
  ok('second save reports unchanged, not created', res.data?.action === 'unchanged', res.data?.action);
  const rows = await rowsFor(COMPANY_A);
  ok('still one customer, no duplicate', rows.length === 1, `count=${rows.length}`);
}

async function case3_phoneFormatMatch() {
  console.log('\n=== 3. Same number, written differently on the card ===');
  const card = freshCard();
  await save(card);
  const stored = (await rowsFor(COMPANY_A)).find((r) => r.email === card.email.toLowerCase());
  const digits = mobileDigits(card.phone);

  // A second card for the same person that shares nothing but the number, and
  // prints it without the +91 or the space. Plain equality misses that and
  // inserts a twin, so the digits have to be what matches.
  const byDigits = {
    name: 'Rakesh V', company: '', email: '', gstin: '',
    phone: `${digits.slice(0, 5)}-${digits.slice(5)}`, address: '', designation: '', website: '',
  };
  const res = await save(byDigits);
  const twins = (await rowsFor(COMPANY_A)).filter((r) => mobileDigits(r.phone).length > 0 && mobileDigits(r.phone).endsWith(digits));
  ok('matched on the digits, not the string', res.data?.id === stored?.id && res.data?.action !== 'created', `${res.data?.action} sameRow=${res.data?.id === stored?.id}`);
  ok('no twin created for one number', twins.length === 1, `rows=${twins.length}`);
  const after = await prisma.customer.findUnique({ where: { id: stored.id } });
  // The record keeps the number it was saved with (the card's first line; the
  // second one lives in notes) rather than the re-formatted version.
  ok('the number already on file is left alone', after?.phone === card.phone.split('/')[0].trim(), after?.phone);
  ok('the name on the record is not replaced by a shorter one', after?.name === card.name, after?.name);

  // And the deliberate other half of the rule: a card that shows a different
  // address for a contact already on file must not rewrite it. An OCR read of
  // an old card is not allowed to silently move a customer.
  const moved = await save({ ...card, address: 'New warehouse, Pune 411001' });
  const kept = await prisma.customer.findUnique({ where: { id: stored.id } });
  ok('a card never rewrites an address already on file',
    moved.data?.action === 'unchanged' && kept?.address === card.address, `${moved.data?.action} :: ${kept?.address}`);
}

async function case4_gstinIsTheStrongestKey() {
  console.log('\n=== 4. GSTIN matches even when the card reads differently ===');
  const card = freshCard();
  const created = await save(card);
  const id = created.data.id;
  await prisma.customer.update({ where: { id }, data: { name: 'Rakesh Verma (typed by me)', email: null } });
  const res = await save({ ...card, name: 'R. Verma', email: `alt${card.email}` });
  ok('found through the GSTIN', res.data?.id === id && res.data?.action === 'updated', `${res.data?.action} sameRow=${res.data?.id === id}`);
  const after = await prisma.customer.findUnique({ where: { id } });
  ok('the name I typed is not overwritten by the card', after?.name === 'Rakesh Verma (typed by me)', after?.name);
  ok('the email that was blank gets filled', (after?.email || '').startsWith('alt'), after?.email);
}

async function case5_badGstinNeverStored() {
  console.log('\n=== 5. A misread GSTIN is refused, not stored ===');
  const card = freshCard({ gstin: '27AABCV5678K1Z' });
  const res = await save(card);
  ok('card still saved — a bad GSTIN must not lose the contact', res.status === 201, res.status);
  const row = await prisma.customer.findUnique({ where: { id: res.data.id } });
  ok('the invalid GSTIN was not written', row?.gstNumber === null, String(row?.gstNumber));
  ok('the seller is told why', /not a valid 15-character GSTIN/.test((res.data.warnings || []).join(' ')), (res.data.warnings || []).join(' '));
}

async function case6_unreadableCard() {
  console.log('\n=== 6. A card with nothing readable on it ===');
  const before = (await rowsFor(COMPANY_A)).length;
  const res = await save({ phone: '9820012345', address: 'somewhere' });
  const after = (await rowsFor(COMPANY_A)).length;
  ok('rejected with a clear message', res.status === 422 && /at least a name/i.test(res.data?.error || ''), `${res.status} ${res.data?.error}`);
  ok('no blank customer created', after === before, `${before} -> ${after}`);
}

async function case7_nameCompanyFallback() {
  console.log('\n=== 7. No GSTIN, no email, no number — just name and company ===');
  const card = { name: `Imran Sheikh ${SEQ}`, company: `Sheikh Hardware ${SEQ}`, designation: 'Owner', address: 'Nagpur' };
  const first = await save(card);
  ok('first one is created', first.data?.action === 'created', first.data?.action);
  const second = await save({ ...card, phone: '9811122233' });
  ok('the repeat is matched on name + company', second.data?.action === 'updated', second.data?.action);
  const matches = (await rowsFor(COMPANY_A)).filter((r) => r.name === card.name);
  ok('one record, now carrying the number', matches.length === 1 && matches[0]?.phone === '9811122233',
    `${matches.length} row(s), phone=${matches[0]?.phone}`);
}

async function case8_tenantIsolation() {
  console.log('\n=== 8. Another firm holds the same contact details ===');
  const card = freshCard();
  await prisma.customer.create({
    data: {
      companyId: COMPANY_B, name: card.name, email: card.email.toLowerCase(),
      phone: '+91 77700 11111', gstNumber: '27AABCV7777K1Z5',
    },
  });
  const res = await save(card);
  ok('this firm gets its own record', res.data?.action === 'created', res.data?.action);
  const b = await prisma.customer.findFirst({ where: { companyId: COMPANY_B, email: card.email.toLowerCase() } });
  ok('the other firm row is untouched', b?.gstNumber === '27AABCV7777K1Z5' && b?.phone === '+91 77700 11111',
    `${b?.gstNumber} ${b?.phone}`);
  const mine = (await rowsFor(COMPANY_A)).filter((r) => r.email === card.email.toLowerCase());
  ok('matched only inside the seller company', mine.length === 1 && mine[0].companyId === COMPANY_A, `rows=${mine.length}`);
}

async function case9_guards() {
  console.log('\n=== 9. Guards on the endpoint ===');
  const anon = await fetch(`${BASE}/api/finance/business-cards/save`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: CARD }),
  });
  ok('anonymous save refused', anon.status === 401, String(anon.status));
  const empty = await api('POST', '/api/finance/business-cards/save', {});
  ok('an empty body refused', empty.status === 400 || empty.status === 422, `${empty.status} ${empty.data?.error}`);
}

async function case10_liveScan() {
  if (!LIVE_IMAGE) {
    console.log('\n=== 10. Live OCR leg skipped (pass a card photo path as argv[2]) ===');
    return;
  }
  console.log('\n=== 10. A real photo through the vision scanner ===');
  const b64 = 'data:image/png;base64,' + fs.readFileSync(LIVE_IMAGE).toString('base64');
  const scan = await api('POST', '/api/finance/business-cards/scan', { imageBase64: b64 });
  ok('scan answered', scan.status === 200, `${scan.status} ${scan.data?.error || ''}`);
  const f = scan.data?.fields || {};
  console.log('    the card was read as: ' + JSON.stringify(f));
  ok('the scan returns the GSTIN field now', Object.prototype.hasOwnProperty.call(f, 'gstin'), `gstin=${f.gstin || '(none read)'}`);
  ok('a name came off the photo', !!f.name, f.name);

  const res = await api('POST', '/api/finance/business-cards/save', { fields: f });
  ok('the photo became a customer row', res.status === 201 && res.data?.action === 'created', `${res.status} ${res.data?.action || res.data?.error}`);
  const row = res.data?.id ? await prisma.customer.findUnique({ where: { id: res.data.id } }) : null;
  ok('the row holds the printed details', !!row?.name && !!row?.phone, `${row?.name} / ${row?.phone} / ${row?.gstNumber}`);
  console.log('    saved: ' + JSON.stringify({
    name: row?.name, phone: row?.phone, email: row?.email, gst: row?.gstNumber,
    state: row?.state, pin: row?.pincode, notes: row?.notes,
  }));
}

async function teardown() {
  console.log('\n=== CLEANUP ===');
  const ids = [COMPANY_A, COMPANY_B].filter(Boolean);
  if (!ids.length) { console.log('  nothing to clean'); return; }
  await prisma.customer.deleteMany({ where: { companyId: { in: ids } } });
  await prisma.user.deleteMany({ where: { email: { in: [EMAIL_A, EMAIL_B] } } });
  await prisma.company.deleteMany({ where: { id: { in: ids } } });
  console.log('  cleaned');
}

async function sweepLeftovers() {
  // A run that crashed earlier leaves its tenants behind; clear them so the
  // row counts asserted below describe only this run.
  const stale = await prisma.user.findMany({ where: { email: { contains: 'card_e2e_' } }, select: { companyId: true } });
  const ids = [...new Set(stale.map((u) => u.companyId).filter(Boolean))];
  if (!ids.length) return;
  await prisma.customer.deleteMany({ where: { companyId: { in: ids } } });
  await prisma.user.deleteMany({ where: { companyId: { in: ids } } });
  await prisma.company.deleteMany({ where: { id: { in: ids } } });
  console.log(`  swept ${ids.length} leftover test tenant(s) from an earlier run`);
}

async function main() {
  console.log('\n=== PROVISION two seller tenants ===');
  await sweepLeftovers();
  COMPANY_A = await provision(EMAIL_A, 'Card Test Traders');
  COMPANY_B = await provision(EMAIL_B, 'Card Test Rivals');
  ok('signed in as the seller', await login(EMAIL_A), EMAIL_A);

  const before = (await rowsFor(COMPANY_A)).length;
  const { card, row } = await case1_firstCard();
  await case2_rescanIsHarmless(card);
  await case3_phoneFormatMatch();
  await case4_gstinIsTheStrongestKey();
  await case5_badGstinNeverStored();
  await case6_unreadableCard();
  await case7_nameCompanyFallback();
  await case8_tenantIsolation();
  await case9_guards();
  await case10_liveScan();

  const all = await rowsFor(COMPANY_A);
  console.log(`\n  customer rows for the seller: ${before} -> ${all.length}`);
  ok('every saved card is a real row a bill can be raised against', all.length >= 5, `total=${all.length}`);
  ok('the case-1 row is still there and complete', all.some((r) => r.id === row.id && r.gstNumber && r.pincode), row?.id);
  const withGstin = all.filter((r) => r.gstNumber);
  ok('stored GSTINs are all 15 characters, no partial reads',
    withGstin.every((r) => r.gstNumber.length === 15), `${withGstin.length} with GSTIN`);
  ok('no two rows share a GSTIN', new Set(withGstin.map((r) => r.gstNumber)).size === withGstin.length,
    `${withGstin.length} distinct`);

  console.log('\n===== RESULT: ' + PASS + ' passed, ' + FAIL + ' failed =====');
}

// Teardown runs even when a case throws, so a crashed run cannot leave test
// tenants sitting in the customer tables.
main()
  .catch((e) => { console.error('HARNESS CRASHED:', e); process.exitCode = 1; })
  .then(teardown)
  .catch((e) => { console.error('CLEANUP FAILED:', e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
