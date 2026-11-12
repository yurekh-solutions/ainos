// Adversarial end-to-end test for the GST self-filing pack.
// Builds a real tenant through the APIs, then probes /api/gst-reports/filing-pack
// against cases the happy path never reaches: derived place of supply, credit-note
// netting, late periods, ineligible credit, broken rows and the ARN round trip.
// Run: node --env-file=.env scripts/_filingPackE2E.cjs
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const BASE = 'http://localhost:3000';
const STAMP = Date.now();
const EMAIL = `pack_e2e${STAMP}@ainos.test`;
const PASSWORD = 'Pack@Test123';
let jar = {};
let COMPANY_ID = null;
let PASS = 0, FAIL = 0;

function ok(name, cond, detail = '') {
  if (cond) { PASS++; console.log(`  [OK]   ${name}${detail ? ' :: ' + detail : ''}`); }
  else { FAIL++; console.log(`  [FAIL] ${name}${detail ? ' :: ' + detail : ''}`); }
}
const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const near = (a, b, tol = 0.02) => Math.abs(Number(a) - Number(b)) <= tol;

// The tab always posts a bounded window, and that window is a single calendar
// month. Mirror it here: an unbounded query spans every period seeded during the
// run, which would make current-period assertions depend on section order.
const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const NOW = new Date();
const WIN = `startDate=${isoDay(NOW).slice(0, 7)}-01&endDate=${isoDay(NOW)}`;
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
  return { status: res.status, data, headers: res.headers };
}
async function raw(path) {
  const res = await fetch(BASE + path, { headers: { Cookie: cookie() }, redirect: 'manual' }); merge(res);
  return { status: res.status, text: await res.text(), headers: res.headers };
}

// Independent re-derivation of the statutory maths, so the test does not simply
// echo whatever the module produced.
function daysLate(dueIso, asOf = new Date()) {
  const due = new Date(`${dueIso}T23:59:59`);
  if (asOf <= due) return 0;
  return Math.floor((asOf.getTime() - due.getTime()) / 86400000);
}
function cap3b(turnover) {
  if (turnover <= 2_50_00_000) return 1_000;
  if (turnover <= 5_00_00_000) return 2_000;
  if (turnover <= 10_00_00_000) return 3_000;
  return 5_000;
}

async function provision() {
  console.log('\n=== PROVISION seller tenant (GSTIN state 27) ===');
  const company = await prisma.company.create({
    data: {
      name: 'Pack Test Sellers', gstNumber: '27AAACS1234A1Z5', state: 'Goa',
      email: EMAIL, phone: '9900000002', companyType: 'Private Limited',
      onboardingStatus: 'approved', createdBy: EMAIL, currency: 'INR',
      invoiceGen: 1, crmAccess: 1, subscriptionStatus: 'trialing',
    },
  });
  COMPANY_ID = company.id;
  await prisma.user.create({
    data: {
      name: 'Pack Tester', email: EMAIL, phone: '9900000002',
      password: await bcrypt.hash(PASSWORD, 10), role: 'owner',
      companyId: COMPANY_ID, emailVerifiedAt: new Date(),
    },
  });
  console.log(`  company=${COMPANY_ID}`);
}

async function login() {
  const csrf = await fetch(BASE + '/api/auth/csrf'); merge(csrf);
  const { csrfToken } = await csrf.json();
  const r = await fetch(BASE + '/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookie() },
    body: new URLSearchParams({ csrfToken, email: EMAIL, password: PASSWORD, callbackUrl: '/dashboard', json: 'true' }),
    redirect: 'manual',
  }); merge(r);
  const s = await api('GET', '/api/auth/session');
  ok('session authenticated', s.data?.user?.email === EMAIL, s.data?.user?.email || 'NONE');
}

async function buildBooks() {
  console.log('\n=== SEED a realistic month (no placeOfSupply sent anywhere) ===');
  // A: intra B2B. The form never sends placeOfSupply, so POS must come from the GSTIN.
  const a = await api('POST', '/api/invoices', {
    customerName: 'Mumbai Traders', customerGst: '27ABCDE1234F1Z5', supplyType: 'intra', status: 'sent',
    items: [
      { productName: 'Widget A', price: 1000, quantity: 2, gstRate: 18, hsnCode: '61091000' },
      { productName: 'Widget B', price: 500, quantity: 1, gstRate: 5, hsnCode: '6109' },
    ],
  });
  // B: inter B2B, later partly returned by a credit note.
  const b = await api('POST', '/api/invoices', {
    customerName: 'Delhi Corp', customerGst: '07ABCDE1234F1Z5', supplyType: 'inter', status: 'paid',
    items: [{ productName: 'Service', price: 10000, quantity: 1, gstRate: 18, hsnCode: '998313' }],
  });
  // C: export on payment of tax -> zero-rated line.
  const c = await api('POST', '/api/invoices', {
    customerName: 'Dubai Buyer', customerGst: '07FGHIJ5678K1Z5', supplyType: 'inter',
    isExport: true, status: 'sent',
    items: [{ productName: 'Export Lot', price: 5000, quantity: 1, gstRate: 18, hsnCode: '61091000' }],
  });
  // D: nil-rated, unregistered, POS stated explicitly.
  const d = await api('POST', '/api/invoices', {
    customerName: 'Kirana Store', placeOfSupply: '27', supplyType: 'intra', status: 'sent',
    items: [{ productName: 'Fresh produce', price: 5000, quantity: 1, gstRate: 0, hsnCode: '0701' }],
  });
  // E: small unregistered retail sale with a stated POS.
  const e = await api('POST', '/api/invoices', {
    customerName: 'Walk In', placeOfSupply: '27', supplyType: 'intra', status: 'sent',
    items: [{ productName: 'Counter sale', price: 1000, quantity: 1, gstRate: 18, hsnCode: '6109' }],
  });
  const created = { a, b, c, d, e };
  ok('all five invoices created', Object.values(created).every((x) => x.status === 201), Object.entries(created).map(([k, v]) => `${k}=${v.status}`).join(' '));

  const invoiceTaxSum = r2([a, b, c, e].reduce((s, x) => s + (x.data?.taxTotal || 0), 0));
  console.log(`  invoice tax total = ${invoiceTaxSum}`);

  // Approved purchase with tax -> ITC. Unapproved spend must not count.
  const exp = await api('POST', '/api/expenses', { title: 'Freight', vendor: 'Delhivery', amount: 10000, taxAmount: 1800, paymentMethod: 'bank' });
  ok('expense created as pending', exp.status === 201 && exp.data?.status === 'pending', exp.data?.status);
  const approved = await api('PUT', '/api/expenses', { id: exp.data.id, status: 'approved' });
  ok('expense approved', approved.status === 200 && approved.data?.status === 'approved', approved.data?.status);

  // Credit note against invoice B, carrying real IGST, linked by invoiceId.
  const cn = await api('POST', '/api/credit-notes', {
    invoiceId: b.data.id, customerName: 'Delhi Corp', subtotal: 5000, tax: 900, igstAmount: 900, total: 5900, reason: 'Goods returned',
  });
  ok('credit note created with IGST', cn.status === 201 || cn.status === 200, `${cn.status} ${cn.data?.noteNumber}`);

  return { invoiceTaxSum, cn };
}

async function testCurrentMonth(invoiceTaxSum) {
  console.log('\n=== PACK for the running period ===');
  const p = await api('GET', `/api/gst-reports/filing-pack?${WIN}`);
  const pack = p.data;
  ok('pack returns 200', p.status === 200, p.status);

  // The single most important guard: nothing here is a real defect, so nothing
  // may be blocked. Five invoices were created without placeOfSupply.
  ok('no false blockers on real data', pack?.validation?.clean === true, JSON.stringify((pack?.validation?.blocking || []).slice(0, 3)));
  ok('every invoice picked up', pack?.summary?.invoiceCount === 5, `count=${pack?.summary?.invoiceCount}`);
  ok(`output tax = ${invoiceTaxSum}`, near(pack?.summary?.outputTax, invoiceTaxSum), pack?.summary?.outputTax);
  ok('nil-rated value lands in the exempt line', near(pack?.gstr3b?.table3?.t312?.exempt, 5000), pack?.gstr3b?.table3?.t312?.exempt);
  ok('export sits on the zero-rated line', near(pack?.gstr3b?.table3?.t316?.igst, 900), pack?.gstr3b?.table3?.t316?.igst);

  // The payable is the money that has to leave the bank: the liability less only
  // the credit the set-off rules allow. Credit notes reduce it; CGST/SGST credit
  // cannot touch the IGST half of it, so the rest carries forward.
  const expectedUsed = 565;        // 282.5 CGST + 282.5 SGST of intra liability
  const expectedCash = r2(invoiceTaxSum - 900 - expectedUsed);
  ok(`payable = output - credit note - usable credit (${expectedCash})`,
    near(pack?.summary?.netTaxPayable, expectedCash) && near(pack?.summary?.itcUsed, expectedUsed) && near(pack?.summary?.creditCarriedForward, 1800 - expectedUsed),
    `cash=${pack?.summary?.netTaxPayable} used=${pack?.summary?.itcUsed} carried=${pack?.summary?.creditCarriedForward} cn=${pack?.gstr3b?.table3?.t315?.downward}`);
  ok('ITC assumed intra-state and split 50/50', near(pack?.gstr3b?.table4?.net?.cgst, 900) && near(pack?.gstr3b?.table4?.net?.sgst, 900), `c=${pack?.gstr3b?.table4?.net?.cgst}`);

  const doc = pack?.gstr1?.docdata || {};
  const b2b = doc.b2b || [];
  ok('three B2B rows (A, B, C)', b2b.length === 3, `b2b=${b2b.length}`);
  ok('B2B place of supply never blank', b2b.every((r) => /^\d{2}$/.test(String(r.pos || ''))), JSON.stringify(b2b.map((r) => r.pos)));
  ok('POS A derived from GSTIN = 27', b2b.some((r) => r.pos === '27'), '');
  ok('POS B derived from GSTIN = 07', b2b.some((r) => r.pos === '07'), '');
  ok('nil section carries the exempt sale', (doc.nil || []).length === 1, `nil=${(doc.nil || []).length}`);
  ok('B2C section carries the counter sale', (doc.b2c || []).length >= 1, `b2c=${(doc.b2c || []).length}`);
  ok('CDNR row picks up the credit note with a POS', (() => {
    const row = (doc.cdnrp || [])[0];
    return !!row && row.rchgs === '07ABCDE1234F1Z5' && row.pos === '07';
  })(), JSON.stringify((doc.cdnrp || [])[0]));
  const hsnCodes = [...(doc.hsn4 || []), ...(doc.hsn6 || [])].map((r) => String(r.hsn));
  ok('real HSN codes survive into the HSN sections', ['61091000', '998313', '0701'].every((h) => hsnCodes.includes(h)), hsnCodes.join(','));

  const heads = (b2b[0]?.itms || []).reduce((s, i) => ({ iamt: s.iamt + i.iamt, camt: s.camt + i.camt, samt: s.samt + i.samt }), { iamt: 0, camt: 0, samt: 0 });
  ok('per-invoice tax heads add up to 385', near(heads.camt + heads.samt + heads.iamt, 385), JSON.stringify(heads));
  ok('IGST liability cannot be met by CGST/SGST credit', (() => {
    const u = pack?.gstr3b?.utilisation;
    return u && u.cashPaid.igst > 0 && u.itcUsed.cgst > 0;
  })(), JSON.stringify(pack?.gstr3b?.utilisation));

  // A return covers one calendar month, so a range that straddles two periods
  // must be called out — as a warning, never as a blocker.
  const straddle = await api('GET', '/api/gst-reports/filing-pack?startDate=2026-04-15&endDate=2026-11-15');
  const periodWarn = (straddle.data?.validation?.warnings || []).find((w) => w.field === 'period');
  ok('a range spanning two tax periods warns', /more than one tax period/.test(periodWarn?.message || ''), JSON.stringify(periodWarn || null));
  ok('the straddle warning never blocks the pack', straddle.data?.validation?.clean === true && (straddle.data?.validation?.blocking || []).length === 0, `clean=${straddle.data?.validation?.clean}`);
  const single = await api('GET', `/api/gst-reports/filing-pack?${WIN}`);
  ok('a single-month range carries no period warning', !(single.data?.validation?.warnings || []).some((w) => w.field === 'period'), '');
  return pack;
}

async function testLatePeriod(current) {
  console.log('\n=== LATE PERIOD: April 2026 with the fee slabs ===');
  for (const t of ['2026-04-05', '2026-04-18']) {
    await prisma.invoice.create({
      data: {
        invoiceNumber: `PACK-LATE-${t.slice(8)}-${STAMP}`, companyId: COMPANY_ID, customerName: 'Late Buyer',
        customerGstNumber: '27ABCDE1234F1Z5', supplyType: 'intra', status: 'sent', invoiceDate: new Date(t),
        createdAt: new Date(t), subtotal: 10000, taxTotal: 1800, cgstAmount: 900, sgstAmount: 900,
        totalAmount: 11800, items: [{ productName: 'Late item', price: 10000, quantity: 1, gstRate: 18, hsnCode: '6109' }],
      },
    });
  }

  const q = '/api/gst-reports/filing-pack?startDate=2026-04-01&endDate=2026-04-30&priorTurnover=5000000';
  const p = await api('GET', q);
  const pack = p.data;
  const pack3bFee = pack?.fees?.gstr3bLateFee;
  ok('April period labelled 042026', pack?.period === '042026', pack?.period);
  ok('April GSTR-1 due 2026-05-11 / 3B due 2026-05-20', pack?.due?.returns?.[0]?.dueDate === '2026-05-11' && pack?.due?.returns?.[1]?.dueDate === '2026-05-20', `${pack?.due?.returns?.[0]?.dueDate} / ${pack?.due?.returns?.[1]?.dueDate}`);

  const d1 = daysLate('2026-05-11'), d3 = daysLate('2026-05-20');
  ok(`days late counted independently (1 = ${d1}, 3B = ${d3})`, pack?.fees?.daysGstr1Late === d1 && pack?.fees?.daysLate === d3, `pack: ${pack?.fees?.daysGstr1Late}/${pack?.fees?.daysLate}`);
  ok('GSTR-1 late fee capped at ₹500', pack?.fees?.gstr1LateFee === 500, pack?.fees?.gstr1LateFee);
  ok('3B late fee capped at ₹1000 for a ₹50 lakh turnover', pack?.fees?.gstr3bLateFee === Math.min(d3 * 50, cap3b(5000000)), `${pack?.fees?.gstr3bLateFee} vs cap ${cap3b(5000000)}`);
  const expInterest = r2(Math.max(0, pack.summary.netTaxPayable) * 18 * d3 / 36500);
  ok('interest = net tax x 18% x days / 365', near(pack?.fees?.interestOnNetTax, expInterest), `pack=${pack?.fees?.interestOnNetTax} expected=${expInterest}`);
  ok('fee total adds up', near(pack?.fees?.total, pack?.fees?.gstr1LateFee + pack?.fees?.gstr3bLateFee + pack?.fees?.interestOnNetTax), pack?.fees?.total);

  const big = await api('GET', q.replace('priorTurnover=5000000', 'priorTurnover=60000000'));
  ok('a ₹6 crore turnover raises the 3B ceiling above the ₹50 lakh one', big.data?.fees?.gstr3bLateFee === cap3b(60000000) && big.data.fees.gstr3bLateFee > pack3bFee, `${pack3bFee} -> ${big.data?.fees?.gstr3bLateFee}`);
  // The only credit note on this tenant was issued in the running month, so it
  // must not net a return for April.
  ok('a November credit note never nets the April payable', pack?.gstr3b?.table3?.t315?.downward === 0, `downward=${pack?.gstr3b?.table3?.t315?.downward}`);
  const inelig = await api('GET', `/api/gst-reports/filing-pack?${WIN}&ineligibleItc=600`);
  ok('ineligible credit under 17(5) comes off the claim', near(inelig.data?.summary?.itcEligible, 1800 - 600), `itc=${inelig.data?.summary?.itcEligible}`);
  // The blocked 600 came out of surplus CGST/SGST credit that was never spendable
  // on the IGST liability, so cash is unchanged and the carried balance falls.
  ok('blocking surplus credit cuts the carry-forward, not the cash', near(inelig.data?.summary?.creditCarriedForward, current.summary.creditCarriedForward - 600) && near(inelig.data?.summary?.netTaxPayable, current.summary.netTaxPayable), `carried=${inelig.data?.summary?.creditCarriedForward} cash=${inelig.data?.summary?.netTaxPayable}`);

  const qrmp = await api('GET', '/api/gst-reports/filing-pack?startDate=2026-04-01&endDate=2026-04-30&scheme=qrmp');
  // April 2026 is month 1 of Q1 FY27, so the quarterly returns are due in July,
  // not mid-May. Getting this wrong makes an on-time seller look 2 months late.
  const qForms = (qrmp.data?.due?.returns || []).map((r) => `${r.form}:${r.dueDate}`);
  ok('QRMP April period is Q1 FY27 with July quarterly deadlines', qForms.join(',') === 'IFF:2026-05-11,GSTR-1:2026-07-13,GSTR-3B:2026-07-22' && /Q1 FY27/.test(qrmp.data?.due?.returns?.[1]?.note || ''), qForms.join(','));
  ok('QRMP late-fee exposure follows the corrected 3B date', qrmp.data?.fees?.daysLate === daysLate('2026-07-22'), `pack=${qrmp.data?.fees?.daysLate} independent=${daysLate('2026-07-22')}`);
  const comp = await api('GET', '/api/gst-reports/filing-pack?startDate=2026-04-01&endDate=2026-04-30&scheme=composition');
  ok('composition switches to CMP-08 + GSTR-4', (comp.data?.due?.returns || []).map((r) => r.form).join(',') === 'CMP-08,GSTR-4', (comp.data?.due?.returns || []).map((r) => r.form).join(','));
}

async function testBrokenRows() {
  console.log('\n=== BROKEN ROWS: block the right ones, warn on the rest ===');
  const mk = (tag, data) => prisma.invoice.create({
    data: {
      invoiceNumber: `PACK-BAD-${tag}-${STAMP}`, companyId: COMPANY_ID, status: 'sent',
      createdAt: new Date('2026-07-10'), invoiceDate: new Date('2026-07-10'),
      subtotal: 1000, taxTotal: 180, totalAmount: 1180, supplyType: 'intra',
      customerName: `Bad ${tag}`, items: [{ productName: 'x', price: 1000, quantity: 1, gstRate: 18 }],
      ...data,
    },
  });
  const interWithCgst = await mk('inter-cgst', { supplyType: 'inter', customerGstNumber: '07ABCDE1234F1Z5', cgstAmount: 90, sgstAmount: 90, igstAmount: 0 });
  const noPosNoGstin = await mk('no-pos', { customerGstNumber: null, placeOfSupply: null, cgstAmount: 90, sgstAmount: 90 });
  const shortGstin = await mk('short-gstin', { customerGstNumber: '07ABCDE1234F1', placeOfSupply: '07', igstAmount: 180, cgstAmount: 0, sgstAmount: 0 });
  const goodNoPos = await mk('good-null-pos', { customerGstNumber: '29BBBBB5678B1Z5', placeOfSupply: null, supplyType: 'inter', igstAmount: 180, cgstAmount: 0, sgstAmount: 0 });
  const badCheckDigit = await mk('check-digit', { customerGstNumber: '27ABCDE1234F1Z9', placeOfSupply: null, cgstAmount: 90, sgstAmount: 90 });

  const p = await api('GET', '/api/gst-reports/filing-pack?startDate=2026-07-01&endDate=2026-07-31');
  const pack = p.data;
  const blocked = (pack?.validation?.blocking || []).map((i) => i.invoiceNumber);
  const warned = (pack?.validation?.warnings || []).map((i) => i.invoiceNumber);
  const fieldsFor = (n) => (pack?.validation?.blocking || []).filter((i) => i.invoiceNumber === n).map((i) => i.field);

  ok('pack still builds over broken data', p.status === 200 && !!pack?.gstr1, p.status);
  ok('blocks inter supply carrying CGST', blocked.includes(interWithCgst.invoiceNumber) && fieldsFor(interWithCgst.invoiceNumber).includes('cgstAmount'), JSON.stringify(fieldsFor(interWithCgst.invoiceNumber)));
  ok('blocks a row with neither POS nor GSTIN', blocked.includes(noPosNoGstin.invoiceNumber) && fieldsFor(noPosNoGstin.invoiceNumber).includes('placeOfSupply'), JSON.stringify(fieldsFor(noPosNoGstin.invoiceNumber)));
  ok('blocks a malformed recipient GSTIN', blocked.includes(shortGstin.invoiceNumber) && fieldsFor(shortGstin.invoiceNumber).includes('customerGstNumber'), JSON.stringify(fieldsFor(shortGstin.invoiceNumber)));
  // Regression guard for the fix: a blank POS with a valid GSTIN is normal data.
  ok('does NOT block a blank POS that the GSTIN supplies', !blocked.includes(goodNoPos.invoiceNumber), JSON.stringify(fieldsFor(goodNoPos.invoiceNumber)));
  ok('check-digit doubt is a warning, never a block', !blocked.includes(badCheckDigit.invoiceNumber) && warned.includes(badCheckDigit.invoiceNumber), `blocked=${blocked.includes(badCheckDigit.invoiceNumber)} warned=${warned.includes(badCheckDigit.invoiceNumber)}`);
  ok('summary says the period is not clean', pack?.validation?.clean === false && pack?.validation?.blocking?.length >= 3, `blocking=${pack?.validation?.blocking?.length}`);
  ok('checklist step 1 tells the user to fix rows first', /blocking issues/i.test(pack?.checklist?.[0]?.detail || ''), pack?.checklist?.[0]?.detail?.slice(0, 60));

  const issues = await raw('/api/gst-reports/filing-pack?startDate=2026-07-01&endDate=2026-07-31&download=sheet&sheet=issues');
  ok('issues sheet now has data rows to work through', issues.status === 200 && /severity,invoice_no,field,message/.test(issues.text) && issues.text.split('\n').length > 2, `${issues.text.split('\n').length} lines`);
  return p;
}

async function testDownloadsAndArn() {
  console.log('\n=== DOWNLOADS + ARN ROUND TRIP ===');
  const j = await raw(`/api/gst-reports/filing-pack?${WIN}&download=gstr1-json`);
  const cd = j.headers.get('content-disposition') || '';
  ok('upload JSON is named for the period and downloadable', j.status === 200 && /attachment; filename="ainos-gstr1-\d{6}/.test(cd), cd);
  const sheet = await raw(`/api/gst-reports/filing-pack?${WIN}&download=sheet&sheet=3b-tables`);
  ok('3B sheet lists the table lines to type in order', sheet.status === 200 && /3\.1\.0/.test(sheet.text) && /6\.1/.test(sheet.text), sheet.status);
  const badSheet = await raw('/api/gst-reports/filing-pack?download=sheet&sheet=not-a-sheet');
  // An unrecognised sheet falls through to the JSON pack rather than inventing a CSV.
  ok('unknown sheet name never yields a bogus CSV', badSheet.status === 200 && !/text\/csv/.test(badSheet.headers.get('content-type') || ''), `${badSheet.status} ${badSheet.headers.get('content-type')}`);
  const whole = await raw(`/api/gst-reports/filing-pack?${WIN}&download=pack`);
  ok('whole pack download carries every section', whole.status === 200 && ['gstr1', 'gstr3b', 'due', 'fees', 'checklist', 'validation'].every((k) => k in JSON.parse(whole.text)), whole.status);

  const bad = await api('POST', '/api/gst-reports/filing-pack', { period: '042026', type: 'GSTR3B', arn: 'AB123' });
  ok('non-numeric ARN rejected with a clear message', bad.status === 400 && /15-digit/.test(bad.data?.error || ''), `${bad.status} ${bad.data?.error}`);
  const good = await api('POST', '/api/gst-reports/filing-pack', { period: '042026', type: 'GSTR3B', arn: '987654321098765', challanNo: '07120261234567' });
  ok('valid ARN marks the return filed', good.status === 201 && good.data?.status === 'filed' && !!good.data?.filedAt, `${good.status} ${good.data?.status}`);
  const row = await prisma.gstFiling.findUnique({ where: { companyId_period_type: { companyId: COMPANY_ID, period: '042026', type: 'GSTR3B' } } });
  ok('ARN persisted in GstFiling.payload, no schema change', row?.payload?.arn === '987654321098765' && row?.payload?.challanNo === '07120261234567', JSON.stringify(row?.payload));
  const refiled = await api('POST', '/api/gst-reports/filing-pack', { period: '042026', type: 'GSTR3B', arn: '987654321098765' });
  ok('re-recording keeps it filed and keeps the ARN', refiled.data?.status === 'filed' && refiled.data?.payload?.arn === '987654321098765', refiled.data?.status);
}

async function cleanup() {
  await prisma.invoice.deleteMany({ where: { companyId: COMPANY_ID } }).catch(() => {});
  await prisma.expense.deleteMany({ where: { companyId: COMPANY_ID } }).catch(() => {});
  await prisma.creditNote.deleteMany({ where: { companyId: COMPANY_ID } }).catch(() => {});
  await prisma.customer.deleteMany({ where: { companyId: COMPANY_ID } }).catch(() => {});
  await prisma.gstFiling.deleteMany({ where: { companyId: COMPANY_ID } }).catch(() => {});
  await prisma.account.deleteMany({ where: { companyId: COMPANY_ID } }).catch(() => {});
  await prisma.user.deleteMany({ where: { email: EMAIL } }).catch(() => {});
  await prisma.company.deleteMany({ where: { id: COMPANY_ID } }).catch(() => {});
  console.log('  cleaned');
}

(async () => {
  try {
    await provision(); await login();
    const { invoiceTaxSum } = await buildBooks();
    await testCurrentMonth(invoiceTaxSum);
    const current = (await api('GET', `/api/gst-reports/filing-pack?${WIN}`)).data;
    await testLatePeriod(current);
    await testBrokenRows();
    await testDownloadsAndArn();
  } catch (e) {
    console.error('SCRIPT ERROR:', e.message, e.stack?.split('\n')[1]);
    FAIL++;
  } finally {
    await cleanup();
    console.log(`\n===== RESULT: ${PASS} passed, ${FAIL} failed =====`);
    await prisma.$disconnect();
    process.exit(FAIL ? 1 : 0);
  }
})();
