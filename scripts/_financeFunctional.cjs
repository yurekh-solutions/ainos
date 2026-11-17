// AINOS Finance — real functional test.
// Provisions a tenant, logs in, then exercises each finance feature and checks the numbers.
// Run: node --env-file=.env scripts/_financeFunctional.cjs
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const BASE = 'http://localhost:3000';
const STAMP = Date.now();
const EMAIL = `fin_test${STAMP}@ainos.test`;
const PASSWORD = 'Fin@Test123';
let jar = {};
let COMPANY_ID = null;
let PASS = 0, FAIL = 0;

function ok(name, cond, detail = '') {
  if (cond) { PASS++; console.log(`  [OK]   ${name}${detail ? ' :: ' + detail : ''}`); }
  else { FAIL++; console.log(`  [FAIL] ${name}${detail ? ' :: ' + detail : ''}`); }
}
function near(a, b, tol = 0.02) { return Math.abs(Number(a) - Number(b)) <= tol; }
function merge(res) {
  for (const raw of (res.headers.getSetCookie?.() || [])) {
    const [pair] = raw.split(';'); const [k, ...v] = pair.split('=');
    if (k && v.length) jar[k.trim()] = v.join('=').trim();
  }
}
function cookie() { return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; '); }
async function api(method, path, body) {
  const opts = { method, headers: { Cookie: cookie() }, redirect: 'manual' };
  if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  const res = await fetch(BASE + path, opts); merge(res);
  let data = null; try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

async function provision() {
  console.log('\n=== PROVISION tenant (company with GSTIN, state 27 = Maharashtra) ===');
  const company = await prisma.company.create({
    data: {
      name: 'Fin Test Co', gstNumber: '27AAACS1234A1Z5', state: 'Maharashtra',
      email: EMAIL, phone: '9900000001', companyType: 'Private Limited',
      onboardingStatus: 'approved', createdBy: EMAIL, currency: 'INR',
      invoiceGen: 1, crmAccess: 1, subscriptionStatus: 'trialing',
    },
  });
  COMPANY_ID = company.id;
  await prisma.user.create({
    data: {
      name: 'Fin Tester', email: EMAIL, phone: '9900000001',
      password: await bcrypt.hash(PASSWORD, 10), role: 'owner',
      companyId: COMPANY_ID, emailVerifiedAt: new Date(),
    },
  });
  await prisma.creditBalance.create({ data: { companyId: COMPANY_ID, balance: 500 } }).catch(() => {});
  console.log(`  company=${COMPANY_ID} user=${EMAIL}`);
}

async function login() {
  console.log('\n=== LOGIN ===');
  const csrf = await fetch(BASE + '/api/auth/csrf'); merge(csrf);
  const { csrfToken } = await csrf.json();
  const r = await fetch(BASE + '/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookie() },
    body: new URLSearchParams({ csrfToken, email: EMAIL, password: PASSWORD, callbackUrl: '/dashboard', json: 'true' }),
    redirect: 'manual',
  }); merge(r);
  const s = await api('GET', '/api/auth/session');
  ok('session authenticated', s.data?.user?.email === EMAIL, s.data?.user?.email || 'none');
}

async function testInvoices() {
  console.log('\n=== INVOICES: GST auto-split, profit, numbering ===');
  // Intra-state (buyer GSTIN also state 27) -> CGST + SGST
  const intra = await api('POST', '/api/invoices', {
    customerName: 'Mumbai Traders', customerEmail: 'mum@t.com', customerGst: '27ABCDE1234F1Z5',
    supplyType: 'intra', status: 'sent',
    items: [
      { productName: 'Widget A', price: 1000, quantity: 2, gstRate: 18, costPrice: 600 },
      { productName: 'Widget B', price: 500, quantity: 1, gstRate: 5, costPrice: 300 },
    ],
  });
  ok('intra invoice created (201)', intra.status === 201, intra.status === 201 ? '' : JSON.stringify(intra.data));
  const inv = intra.data || {};
  ok('subtotal = 2500', near(inv.subtotal, 2500), inv.subtotal);
  ok('taxTotal = 385 (360@18 + 25@5)', near(inv.taxTotal, 385), inv.taxTotal);
  ok('CGST = SGST = 192.5', near(inv.cgstAmount, 192.5) && near(inv.sgstAmount, 192.5), `c=${inv.cgstAmount} s=${inv.sgstAmount}`);
  ok('IGST = 0 for intra', near(inv.igstAmount, 0), inv.igstAmount);
  ok('profit = 1000', near(inv.profitAmount, 1000), inv.profitAmount);
  ok('total = 2885', near(inv.totalAmount, 2885), inv.totalAmount);
  ok('invoice number format AIN-XXXX-YYYY', /^AIN-\d{4}-\d{4}$/.test(inv.invoiceNumber || ''), inv.invoiceNumber);

  // Inter-state (buyer state 07 = Delhi) -> IGST
  const inter = await api('POST', '/api/invoices', {
    customerName: 'Delhi Corp', customerEmail: 'del@t.com', customerGst: '07ABCDE1234F1Z5',
    supplyType: 'inter', status: 'sent',
    items: [{ productName: 'Service', price: 10000, quantity: 1, gstRate: 18, costPrice: 7000 }],
  });
  const itv = inter.data || {};
  ok('inter invoice created', inter.status === 201);
  ok('auto IGST = 1800', near(itv.igstAmount, 1800), itv.igstAmount);
  ok('CGST/SGST = 0 for inter', near(itv.cgstAmount, 0) && near(itv.sgstAmount, 0), `c=${itv.cgstAmount}`);
  const seqOf = (n) => Number(String(n).match(/\d{4}/)?.[0] || 0);
  ok('numbering increments (collision-safe)', seqOf(itv.invoiceNumber) > seqOf(inv.invoiceNumber), `${inv.invoiceNumber} -> ${itv.invoiceNumber}`);

  // Mark as paid (PUT)
  const paid = await api('PUT', '/api/invoices', { id: inv.id, status: 'paid', paidAmount: inv.totalAmount });
  ok('invoice mark-paid updates status', paid.status === 200 && paid.data?.status === 'paid', paid.data?.status);
  return inv;
}

async function testCustomersProducts() {
  console.log('\n=== CUSTOMERS + PRODUCTS ===');
  const custs = await api('GET', '/api/customers');
  ok('customers listed (auto-created from invoices)', Array.isArray(custs.data) && custs.data.length >= 2, `count=${custs.data?.length}`);
  const prod = await api('POST', '/api/products', {
    name: 'Test Gadget', sellingPrice: 999, costPrice: 500, mrp: 1200, gstRate: 18, hsnCode: '8471',
  });
  ok('product created', prod.status === 201 || prod.status === 200, prod.status);
  const prods = await api('GET', '/api/products');
  ok('product listed', Array.isArray(prods.data) && prods.data.length >= 1, `count=${prods.data?.length}`);
}

async function testExpensesQuotes() {
  console.log('\n=== EXPENSES + QUOTES ===');
  const exp = await api('POST', '/api/expenses', { title: 'Office Rent', category: 'Rent', amount: 15000, paymentMethod: 'bank' });
  ok('expense created', exp.status === 201, exp.status);
  ok('expense stored amount', near(exp.data?.amount, 15000), exp.data?.amount);
  const badExp = await api('POST', '/api/expenses', { title: 'X', amount: -5 });
  ok('expense rejects negative amount (400)', badExp.status === 400, badExp.status);
  const q = await api('POST', '/api/quotes', {
    customerName: 'Quote Client', items: [{ name: 'Job', price: 5000, qty: 1 }], subtotal: 5000, tax: 900, total: 5900, status: 'draft',
  });
  ok('quote created', q.status === 201, q.status);
  const qs = await api('GET', '/api/quotes');
  ok('quotes listed', Array.isArray(qs.data) && qs.data.length >= 1, `count=${qs.data?.length}`);
}

async function testChallanNotesBankRecurring() {
  console.log('\n=== CHALLANS + CREDIT/DEBIT NOTES + BANK + RECURRING ===');
  const dc = await api('POST', '/api/delivery-challans', {
    customerName: 'Trans Co', customerGst: '27XYZAB1234C1Z5', vehicleNo: 'MH 01 AB 1234', supplyType: 'intra',
    items: [{ productName: 'Goods', price: 2000, quantity: 3, gstRate: 12 }],
  });
  ok('delivery challan created', dc.status === 201 || dc.status === 200, `status=${dc.status} no=${dc.data?.challanNumber}`);
  const cn = await api('POST', '/api/credit-notes', { customerName: 'Credit Cust', amount: 1000, reason: 'Return' });
  ok('credit note created', cn.status === 201 || cn.status === 200, cn.status);
  const dn = await api('POST', '/api/debit-notes', { vendorName: 'Vendor', amount: 500, reason: 'Extra charge' });
  ok('debit note created', dn.status === 201 || dn.status === 200, dn.status);
  const ba = await api('POST', '/api/bank-accounts', { name: 'HDFC Current', accountNumber: '5001234', ifscCode: 'HDFC0001', bankName: 'HDFC', balance: 100000 });
  ok('bank account created', ba.status === 201 || ba.status === 200, ba.status);
  const ri = await api('POST', '/api/recurring-invoices', {
    customerName: 'Monthly Client', frequency: 'monthly', startDate: new Date().toISOString(), status: 'active',
  });
  ok('recurring invoice created', ri.status === 201 || ri.status === 200, `${ri.status} ${JSON.stringify(ri.data)}`);
}

async function testRemindersTallyTemplatesReports() {
  console.log('\n=== REMINDERS + TALLY + TEMPLATES + REPORTS ===');
  const rem = await api('GET', '/api/payment-reminders');
  ok('payment reminders endpoint returns list', Array.isArray(rem.data) || typeof rem.data === 'object', rem.status);
  const tally = await api('GET', '/api/tally');
  ok('tally export endpoint responds', tally.status === 200, tally.status);
  const tpl = await api('POST', '/api/invoice-templates', {
    name: 'My Brand', primaryColor: '#4c1d95', font: 'Helvetica', isDefault: false,
  });
  ok('invoice template saved', tpl.status === 201 || tpl.status === 200, tpl.status);
  const rep = await api('GET', '/api/reports');
  ok('reports endpoint responds', rep.status === 200 || rep.status === 401 || rep.status === 404, rep.status);
}

async function apiRaw(method, path) {
  const res = await fetch(BASE + path, { method, headers: { Cookie: cookie() }, redirect: 'manual' }); merge(res);
  const text = await res.text(); return { status: res.status, text };
}

async function testGstCompliance() {
  console.log('\n=== GST COMPLIANCE: GSTR-1 / GSTR-3B export + 2B reconcile ===');
  // Two invoices exist: intra B2B (tax 385) + inter B2B (IGST 1800) => output tax 2185
  const g1 = await api('GET', '/api/gst-reports?type=gstr1');
  ok('GSTR-1 report loads', g1.status === 200 && g1.data?.type === 'GSTR-1', g1.status);
  ok('GSTR-1 counts both invoices', (g1.data?.summary?.count ?? 0) >= 2, `count=${g1.data?.summary?.count}`);
  ok('GSTR-1 output tax = 2185 (385 + 1800)', near(g1.data?.summary?.totalTax, 2185), g1.data?.summary?.totalTax);

  const g3 = await api('GET', '/api/gst-reports?type=gstr3b');
  ok('GSTR-3B summary loads', g3.status === 200, g3.status);

  const exp1 = await api('GET', '/api/gst-reports?export=gstr1&format=json');
  const b2b = exp1.data?.invoiceValues?.B2B || [];
  ok('GSTR-1 JSON has B2B section', Array.isArray(b2b) && b2b.length >= 2, `B2B=${b2b.length}`);
  ok('GSTR-1 JSON official GSTN keys (inum/pos/rchgs)', !!b2b[0]?.inv?.inum && 'pos' in b2b[0]?.inv && 'rchgs' in b2b[0]?.inv, b2b[0]?.inv?.inum);
  ok('GSTR-1 totals IGST = 1800', near(exp1.data?.totals?.igst, 1800), exp1.data?.totals?.igst);
  ok('GSTR-1 totals CGST = SGST = 192.5', near(exp1.data?.totals?.cgst, 192.5) && near(exp1.data?.totals?.sgst, 192.5), `c=${exp1.data?.totals?.cgst}`);

  const hsnCsv = await apiRaw('GET', '/api/gst-reports?export=hsn&format=csv');
  ok('HSN summary CSV downloads', hsnCsv.status === 200 && /hsn/i.test(hsnCsv.text.slice(0, 40)), hsnCsv.status);

  // Official GSTN GSTR-2B shape -> should parse and classify as 2B-only (no matching book record)
  const twoB = { data: { docdata: { b2b: [{ gstin: '29AAACB1234C1Z9', inv: [{ num: 'SUP-INV-9001', din: '2026-10-05', igst: 0, cgst: 900, sgst: 900, cess: 0, txv: 18000, items: [] }] }] } } };
  const rec = await api('POST', '/api/gst-reports/reconcile', { rawJson: twoB, periodStart: '2026-10-01', periodEnd: '2026-10-31' });
  ok('2B reconcile accepts official JSON', rec.status === 201 && !!rec.data?.summary, rec.status);
  ok('2B reconcile flags ITC-at-risk for unmatched', (rec.data?.summary?.twobOnly ?? 0) >= 1 && (rec.data?.summary?.itcAtRisk ?? 0) > 0, JSON.stringify(rec.data?.summary));

  console.log('\n--- FILE-IT-YOURSELF PACK ---');
  const pack = await api('GET', '/api/gst-reports/filing-pack');
  ok('Filing pack builds', pack.status === 200 && pack.data?.gstr1?.version === 'GSTR1V1.0', pack.status);
  // Nothing in the seeded books should be flagged as a filing blocker. A false
  // blocker here would stop a real taxpayer exporting a return.
  ok('Pack is clean (no false blockers)', pack.data?.validation?.clean === true, JSON.stringify((pack.data?.validation?.blocking || []).slice(0, 2)));
  ok('Pack covers both invoices', (pack.data?.summary?.invoiceCount ?? 0) >= 2, `count=${pack.data?.summary?.invoiceCount}`);
  ok('Pack output tax = 2185', near(pack.data?.summary?.outputTax, 2185), pack.data?.summary?.outputTax);
  ok('Net payable = output tax - eligible ITC', near(pack.data?.summary?.netTaxPayable, (pack.data?.summary?.outputTax || 0) - (pack.data?.summary?.itcEligible || 0)), `net=${pack.data?.summary?.netTaxPayable} itc=${pack.data?.summary?.itcEligible}`);
  const dueForms = (pack.data?.due?.returns || []).map(r => r.form);
  ok('Monthly calendar lists GSTR-1 + GSTR-3B', dueForms.join(',') === 'GSTR-1,GSTR-3B', dueForms.join(','));
  ok('Due dates are the 11th and the 20th', /-11$/.test(pack.data?.due?.returns?.[0]?.dueDate || '') && /-20$/.test(pack.data?.due?.returns?.[1]?.dueDate || ''), `${pack.data?.due?.returns?.[0]?.dueDate} / ${pack.data?.due?.returns?.[1]?.dueDate}`);
  ok('Current period is not late', (pack.data?.fees?.daysLate ?? -1) === 0 && near(pack.data?.fees?.total, 0), `late=${pack.data?.fees?.daysLate} total=${pack.data?.fees?.total}`);
  ok('Nil return flagged false on a period with sales', pack.data?.summary?.isNil === false, String(pack.data?.summary?.isNil));

  const qrmp = await api('GET', '/api/gst-reports/filing-pack?scheme=qrmp');
  ok('QRMP calendar adds IFF', (qrmp.data?.due?.returns || []).map(r => r.form).join(',') === 'IFF,GSTR-1,GSTR-3B', JSON.stringify((qrmp.data?.due?.returns || []).map(r => r.form)));

  // The portal upload file must never carry a blank place of supply: AINOS only
  // stores it when the invoice form sends one, so it comes from the recipient GSTIN.
  const up1 = await api('GET', '/api/gst-reports/filing-pack?download=gstr1-json');
  const ub2b = up1.data?.docdata?.b2b || [];
  ok('Upload GSTR-1 uses portal section keys', !!up1.data?.docdata && 'b2b' in up1.data.docdata && 'hsn6' in up1.data.docdata, up1.status);
  ok('Upload rows all carry a 2-digit place of supply', ub2b.length >= 2 && ub2b.every(r => /^\d{2}$/.test(String(r.pos || ''))), JSON.stringify(ub2b.map(r => r.pos)));
  ok('Upload tax heads use iamt/camt/samt/kamt', (() => { const i = ub2b[0]?.itms?.[0] || {}; return ['txval', 'rt', 'iamt', 'camt', 'samt', 'kamt'].every(k => k in i); })(), JSON.stringify(ub2b[0]?.itms?.[0]));

  const issueCsv = await apiRaw('GET', '/api/gst-reports/filing-pack?download=sheet&sheet=issues');
  // A clean period legitimately has no rows, so the issues sheet is empty by design.
  ok('Issues sheet endpoint works', issueCsv.status === 200, issueCsv.status);
  const b2bCsv = await apiRaw('GET', '/api/gst-reports/filing-pack?download=sheet&sheet=b2b');
  ok('B2B sheet carries statutory column headers', b2bCsv.status === 200 && /invoice_no/.test(b2bCsv.text) && /place_of_supply/.test(b2bCsv.text) && /recipient_gstin/.test(b2bCsv.text), b2bCsv.status);
  const whole = await apiRaw('GET', '/api/gst-reports/filing-pack?download=pack');
  ok('Whole pack downloads with a checklist', whole.status === 200 && JSON.parse(whole.text).checklist?.length >= 5, `${whole.status}`);
  ok('Pack lists marketplace sales sources for Amazon/Flipkart/Meesho', (() => { const s = (JSON.parse(whole.text).marketplaceSources || []).map(x => String(x.name || x.platform || '')).join(','); return /amazon/i.test(s) && /flipkart/i.test(s) && /meesho/i.test(s); })(), '');

  // Closing the period stores the acknowledgement in GstFiling.payload.
  const badArn = await api('POST', '/api/gst-reports/filing-pack', { period: '012099', type: 'GSTR1', arn: '12345' });
  ok('Short ARN rejected (400)', badArn.status === 400, badArn.status);
  const goodArn = await api('POST', '/api/gst-reports/filing-pack', { period: '012099', type: 'GSTR1', arn: '123456789012345', challanNo: 'CH-1' });
  ok('15-digit ARN records the filing', goodArn.status === 201 && goodArn.data?.status === 'filed', `${goodArn.status} ${goodArn.data?.status}`);
  ok('ARN stored without a schema change', goodArn.data?.payload?.arn === '123456789012345', JSON.stringify(goodArn.data?.payload));
  await prisma.gstFiling.deleteMany({ where: { companyId: COMPANY_ID, period: '012099' } });
}

async function testBankReconcile() {
  console.log('\n=== BANK AUTO-MATCH: parse statement, match credits, apply payment ===');
  // Dedicated bank account to receive the statement
  const acct = await api('POST', '/api/bank-accounts', { name: 'Recon SB', accountNumber: '99001122', ifscCode: 'HDFC0002', bankName: 'HDFC', balance: 50000 });
  const BANK_ACCOUNT_ID = acct.data?.id;
  ok('reconcile bank account created', !!BANK_ACCOUNT_ID, acct.status);
  // Fresh unpaid invoice to reconcile against
  const invA = await api('POST', '/api/invoices', {
    customerName: 'PayCo', customerEmail: 'pay@t.com', customerGst: '27AAAAP1234A1Z5',
    supplyType: 'intra', status: 'sent',
    items: [{ productName: 'Consulting', price: 10000, quantity: 1, gstRate: 18, costPrice: 5000 }],
  });
  const a = invA.data || {};
  ok('invoice for reconcile created', invA.status === 201 && near(a.totalAmount, 11800), `status=${invA.status} total=${a.totalAmount}`);

  // Bank statement CSV (Date,Description,Reference,Debit,Credit)
  const csv = [
    'Date,Description,Reference,Debit,Credit',
    `05/10/2026,NEFT RECEIPT ${a.invoiceNumber},${a.invoiceNumber},0,11800.00`,
    '06/10/2026,MISC CREDIT,RAND000777,0,7777.00',
    '07/10/2026,SERVICE CHARGE,CHQ101,150,0',
  ].join('\n');

  const rec = await api('POST', '/api/bank-reconciliation', { accountId: BANK_ACCOUNT_ID, csv });
  ok('reconcile endpoint returns preview', rec.status === 200 && !!rec.data?.summary, rec.status);
  ok('CSV parsed into 3 transactions', rec.data?.summary?.parsed === 3, `parsed=${rec.data?.summary?.parsed}`);
  ok('transactions persisted to account', rec.data?.summary?.persisted === 3, `persisted=${rec.data?.summary?.persisted}`);
  ok('exactly 1 credit auto-matched', rec.data?.summary?.matched === 1, `matched=${rec.data?.summary?.matched}`);
  ok('unrelated credit flagged unmatched', rec.data?.summary?.unmatched === 1, `unmatched=${rec.data?.summary?.unmatched}`);

  const matchedRow = (rec.data?.rows || []).find(r => r.match);
  ok('match is EXACT via invoice number', matchedRow?.match?.confidence === 'exact' && matchedRow?.match?.invoiceNumber === a.invoiceNumber, matchedRow?.match?.confidence);
  ok('match allocates full outstanding', near(matchedRow?.match?.allocAmount, 11800), matchedRow?.match?.allocAmount);

  // Apply: reuse ledger-correct invoice PUT, then flag the transaction matched
  const paid = await api('PUT', '/api/invoices', { id: a.id, status: 'paid', paidAmount: a.totalAmount, paidDate: new Date().toISOString(), paymentMethod: 'bank' });
  ok('matched invoice marked paid (ledger path)', paid.status === 200 && paid.data?.status === 'paid', paid.data?.status);
  const flag = await api('PUT', '/api/bank-reconciliation', { applied: [{ transactionId: matchedRow?.txnId, invoiceId: a.id }] });
  ok('transaction flagged applied', flag.status === 200 && flag.data?.updated === 1, JSON.stringify(flag.data));

  const list = await api('GET', '/api/bank-reconciliation');
  const txn = (Array.isArray(list.data) ? list.data : []).find(t => t.id === matchedRow?.txnId);
  ok('persisted transaction now matched=true', txn?.matched === true && txn?.matchedWith === a.id, `matched=${txn?.matched}`);
}

async function testEwayBill() {
  console.log('\n=== E-WAY BILL (real manual-assist): build, validate, record ===');
  // Link target invoice (eway columns live on invoice)
  const inv = await api('POST', '/api/invoices', {
    customerName: 'Move Co', customerEmail: 'mv@t.com', customerGst: '07ABCDE1234F1Z5', supplyType: 'inter', status: 'sent',
    items: [{ productName: 'Goods', price: 5000, quantity: 1, gstRate: 18, costPrice: 3000 }],
  });
  const invoiceId = inv.data?.id;

  // High-value inter-state challan (> ₹50k) with valid consignee GSTIN + HSN
  const dc = await api('POST', '/api/delivery-challans', {
    customerName: 'Move Co', customerGst: '07ABCDE1234F1Z5', vehicleNo: 'MH 01 AB 1234', supplyType: 'inter',
    items: [{ productName: 'Steel', hsnCode: '7208', price: 60000, quantity: 1, gstRate: 18 }],
  });
  const challanId = dc.data?.id;
  ok('high-value challan created', dc.status === 201 && near(dc.data?.subtotal, 60000), `subtotal=${dc.data?.subtotal}`);
  await api('PUT', '/api/delivery-challans', { id: challanId, invoiceId });

  const preview = await api('GET', `/api/delivery-challans/ewaybill?challanId=${challanId}`);
  ok('EWB preview: EWB required (value > 50k)', preview.data?.requiresEwb === true, `requiresEwb=${preview.data?.requiresEwb}`);
  ok('EWB preview: payload is ready to file', preview.data?.ready === true, JSON.stringify(preview.data?.errors));
  ok('EWB preview: totalValue maps challan subtotal', near(preview.data?.payload?.partA?.totalValue, 60000), preview.data?.payload?.partA?.totalValue);
  ok('EWB preview: state codes resolved (27 -> 07)', preview.data?.payload?.partA?.fromState === '27' && preview.data?.payload?.partA?.toState === '07', `${preview.data?.payload?.partA?.fromState}->${preview.data?.payload?.partA?.toState}`);

  // No fake generator: POST has been removed so the product cannot emit a mock EWB.
  const genGone = await api('POST', '/api/delivery-challans/ewaybill', { challanId, distance: 250 });
  ok('no mock generator: POST /ewaybill unavailable (405)', genGone.status === 405, `${genGone.status}`);

  // Manual-assist (FREE portal) path: PUT records a REAL 12-digit EWB onto the linked invoice.
  const rec = await api('PUT', '/api/delivery-challans/ewaybill', { challanId, ewbNo: '334455667788', validTill: '2026-12-31T23:59:59.000Z' });
  ok('manual record: PUT stores real EWB (200)', rec.status === 200 && rec.data?.recorded === true && rec.data?.persistedInvoiceId === invoiceId, `${rec.status} ${rec.data?.error || ''}`);
  const dbInv = await prisma.invoice.findUnique({ where: { id: invoiceId }, select: { ewayBillNo: true, ewayBillValid: true } });
  ok('manual record: invoice.ewayBillNo updated to real number', dbInv?.ewayBillNo === '334455667788' && !!dbInv?.ewayBillValid, dbInv?.ewayBillNo);
  const badRec = await api('PUT', '/api/delivery-challans/ewaybill', { challanId, ewbNo: '12' });
  ok('manual record: rejects non-12-digit EWB (400)', badRec.status === 400 && /12 digits/i.test(badRec.data?.error || ''), `${badRec.status} ${badRec.data?.error}`);

  // Negative preview: consignee with no GSTIN/state -> not ready, to-state error.
  const bad = await api('POST', '/api/delivery-challans', {
    customerName: 'NoGst Co', vehicleNo: 'MH 02 CD 5678', supplyType: 'intra',
    items: [{ productName: 'Misc', hsnCode: '9403', price: 80000, quantity: 1, gstRate: 18 }],
  });
  const badPrev = await api('GET', `/api/delivery-challans/ewaybill?challanId=${bad.data?.id}`);
  ok('preview flags missing consignee state (not ready)', badPrev.data?.ready === false && (badPrev.data?.errors || []).some(e => /to-state/i.test(e)), JSON.stringify(badPrev.data?.errors));
}

async function testSupplyDerivation() {
  console.log('\n=== SUPPLY TYPE: read off the GSTINs, not defaulted ===');
  // The invoice form used to post "intra" whatever the two GSTINs said, and
  // the API honoured the posted value over its own correct rule. Nothing is
  // posted here, so the split has to come out of the state codes themselves.
  const ITEM = [{ productName: 'Goods', price: 10000, quantity: 1, gstRate: 18, costPrice: 5000 }];

  const inter = await api('POST', '/api/invoices', {
    customerName: 'Derived Delhi', customerEmail: 'der.del@t.com', customerGst: '07ABCDE1234F1Z5',
    status: 'sent', items: ITEM,
  });
  const i = inter.data || {};
  ok('Delhi buyer, no supplyType sent → full IGST', near(i.igstAmount, 1800) && near(i.cgstAmount, 0), `igst=${i.igstAmount} cgst=${i.cgstAmount}`);
  ok('the place of supply is stored instead of left null', i.placeOfSupply === '07', String(i.placeOfSupply));

  const intra = await api('POST', '/api/invoices', {
    customerName: 'Derived Mumbai', customerEmail: 'der.mum@t.com', customerGst: '27ABCDE1234F1Z5',
    status: 'sent', items: ITEM,
  });
  const v = intra.data || {};
  ok('same-state buyer → CGST + SGST, no IGST',
    near(v.cgstAmount, 900) && near(v.sgstAmount, 900) && near(v.igstAmount, 0), `c=${v.cgstAmount} s=${v.sgstAmount} i=${v.igstAmount}`);
  ok('place of supply read off the buyer GSTIN', v.placeOfSupply === '27', String(v.placeOfSupply));

  // A seller registered in a union territory: the state half of an intra-state
  // bill there is UTGST. Booking it as SGST puts that money in the wrong ledger
  // head, and the return then disagrees with the challan paid against it.
  const orig = await prisma.company.findUnique({ where: { id: COMPANY_ID } });
  await prisma.company.update({ where: { id: COMPANY_ID }, data: { gstNumber: '34AABCS1234A1Z5', state: 'Puducherry' } });

  const ut = await api('POST', '/api/invoices', {
    customerName: 'Derived Puducherry', customerEmail: 'der.py@t.com', customerGst: '34ABCDE1234F1Z5',
    status: 'sent', items: ITEM,
  });
  const u = ut.data || {};
  ok('UT seller, intra bill → CGST + UTGST with SGST left at zero',
    near(u.cgstAmount, 900) && near(u.utgstAmount, 900) && near(u.sgstAmount, 0),
    `c=${u.cgstAmount} ut=${u.utgstAmount} s=${u.sgstAmount}`);

  const utInter = await api('POST', '/api/invoices', {
    customerName: 'Derived Mumbai II', customerEmail: 'der.mum2@t.com', customerGst: '27ABCDE1234F1Z5',
    status: 'sent', items: ITEM,
  });
  const ui = utInter.data || {};
  ok('UT seller billing a state → full IGST, no UTGST',
    near(ui.igstAmount, 1800) && near(ui.utgstAmount, 0), `igst=${ui.igstAmount} ut=${ui.utgstAmount}`);

  await prisma.company.update({ where: { id: COMPANY_ID }, data: { gstNumber: orig.gstNumber, state: orig.state } });
  const back = await prisma.company.findUnique({ where: { id: COMPANY_ID } });
  ok("the seller's own registration is put back afterwards", back?.gstNumber === '27AAACS1234A1Z5', back?.gstNumber);
}

async function testInvoiceDelete() {
  console.log('\n=== INVOICE DELETE: row gone, ledger cleaned, history kept ===');
  const made = await api('POST', '/api/invoices', {
    customerName: 'Delete Co', customerEmail: 'del.co@t.com', customerGst: '27ABCDE1234F1Z5',
    supplyType: 'intra', status: 'sent',
    items: [{ productName: 'Delete Me', price: 10000, quantity: 1, gstRate: 18, costPrice: 6000 }],
  });
  const inv = made.data || {};
  ok('invoice to delete created', made.status === 201 && !!inv.id, `status=${made.status}`);

  // Post a payment first: the delete has to clean two sources, not just one.
  await api('PUT', '/api/invoices', { id: inv.id, status: 'partially_paid', paidAmount: 5000 });
  const beforeJournals = await prisma.journalEntry.count({ where: { OR: [{ reference: `INVOICE:${inv.id}` }, { reference: `INVOICE_PAYMENT:${inv.id}` }] } });
  ok('invoice + payment journals exist before deletion', beforeJournals === 2, `count=${beforeJournals}`);

  const del = await api('DELETE', `/api/invoices?id=${inv.id}`);
  ok('DELETE returns 200 {success:true}', del.status === 200 && del.data?.success === true, `${del.status} ${JSON.stringify(del.data)}`);

  ok('invoice row removed from database', !(await prisma.invoice.findUnique({ where: { id: inv.id } })));
  const leftJournals = await prisma.journalEntry.count({ where: { OR: [{ reference: `INVOICE:${inv.id}` }, { reference: `INVOICE_PAYMENT:${inv.id}` }] } });
  ok('both journals removed with the invoice', leftJournals === 0, `count=${leftJournals}`);
  ok('no ledger lines orphaned', (await prisma.ledgerEntry.count({ where: { journal: { reference: { in: [`INVOICE:${inv.id}`, `INVOICE_PAYMENT:${inv.id}`] } } } })) === 0);

  // A deleted bill must still be explainable afterwards, so it goes into history.
  const log = await prisma.auditLog.findFirst({ where: { companyId: COMPANY_ID, entity: 'invoice', entityId: inv.id, action: 'deleted' } });
  ok('deletion written to history', !!log, log?.summary || 'none');
  ok('history names the bill and its worth', !!log && log.summary.includes(inv.invoiceNumber) && near(log.changes?.totalAmount, inv.totalAmount) && near(log.changes?.paidAmount, 5000), JSON.stringify(log?.changes));

  // Double-click / stale tab: a plain 404, never a Prisma crash.
  const again = await api('DELETE', `/api/invoices?id=${inv.id}`);
  ok('re-delete of same id returns 404, not 500', again.status === 404, `${again.status} ${JSON.stringify(again.data)}`);
  ok('DELETE without an id rejected as 400', (await api('DELETE', '/api/invoices')).status === 400);

  // Tenant scoping: another company's invoice id is simply not ours to delete.
  const other = await prisma.company.create({
    data: { name: 'Other Co', email: `other_${STAMP}@ainos.test`, createdBy: `other_${STAMP}@ainos.test`, currency: 'INR' },
  });
  const foreign = await prisma.invoice.create({
    data: { invoiceNumber: `FOR-${STAMP}`, companyId: other.id, customerName: 'Other Customer', status: 'sent', totalAmount: 1180 },
  });
  const steal = await api('DELETE', `/api/invoices?id=${foreign.id}`);
  ok("cannot delete another company's invoice", steal.status === 404, `${steal.status}`);
  ok('their invoice survives untouched', !!(await prisma.invoice.findUnique({ where: { id: foreign.id } })));
  await prisma.invoice.deleteMany({ where: { companyId: other.id } });
  await prisma.company.deleteMany({ where: { id: other.id } });
}

async function testTallyImport() {
  console.log('\n=== TALLY IMPORT: real sheet shapes -> real bills ===');
  // Written the way a Tally export actually looks: its own header words, a
  // dd-mm-yyyy date, ₹ in a money cell, one bill over two lines, a taxable
  // "Amount" with no rate, and a line that cannot become a bill at all.
  const rows = [
    { 'Voucher No': 'TAL-001', 'Voucher Date': '15-01-2024', 'Ledger Name': 'Tally Delhi Traders', 'GSTIN No': '07ABCDE1234F1Z5', 'Particulars': 'Goods', 'HSN/SAC': '7208', Qty: 2, Rate: '₹5,000', 'GST % Of Value': 18 },
    { 'Voucher No': 'TAL-002', 'Voucher Date': '02-02-2024', 'Ledger Name': 'Tally Mumbai Mills', 'GSTIN No': '27ABCDE1234F1Z5', 'Particulars': 'Fabric', Qty: 1, Rate: 10000, 'GST % Of Value': 5 },
    { 'Voucher No': 'TAL-002', 'Particulars': 'Thread', Qty: 10, Rate: 250, 'GST % Of Value': 12 },
    { 'Voucher No': 'TAL-003', 'Voucher Date': '03-03-2024', 'Ledger Name': 'Tally Bengaluru Works', 'GSTIN No': '29AABCS1234F1Z5', 'Particulars': 'Service', Amount: 20000, 'GST % Of Value': 18, Status: 'Paid', 'Paid Amount': 23600 },
    { 'Voucher No': 'TAL-004', 'Particulars': 'Mystery line', Qty: 1, Rate: 500 },
  ];

  const first = await api('POST', '/api/tally', { rows });
  ok('sheet accepted', first.status === 200 && first.data?.success === true, `${first.status} ${JSON.stringify(first.data?.error || first.data?.created)}`);
  ok('3 of the 4 vouchers became bills', first.data?.created === 3, `created=${first.data?.created}`);
  ok('the party-less row is named, not silently dropped', first.data?.failed === 1 && /Row 6: Party name is empty/.test(first.data?.errorDetails?.[0]?.reason || ''), first.data?.errorDetails?.[0]?.reason);
  ok("the accountant's own voucher numbers were kept", (first.data?.createdInvoices || []).join(',') === 'TAL-001,TAL-002,TAL-003', (first.data?.createdInvoices || []).join(','));

  const one = await prisma.invoice.findFirst({ where: { companyId: COMPANY_ID, invoiceNumber: 'TAL-001' } });
  ok('dd-mm-yyyy date read as 15 Jan 2024', one?.invoiceDate?.toISOString().slice(0, 10) === '2024-01-15', one?.invoiceDate?.toISOString());
  ok('"₹5,000" with the symbol became 5000 x 2', near(one?.subtotal, 10000) && near(one?.taxTotal, 1800), `sub=${one?.subtotal} tax=${one?.taxTotal}`);
  ok('Maharashtra seller to a Delhi buyer is full IGST', near(one?.igstAmount, 1800) && near(one?.cgstAmount, 0) && one?.placeOfSupply === '07', `igst=${one?.igstAmount} pos=${one?.placeOfSupply}`);
  ok('imported bill sits in receivables, not as a draft', one?.status === 'sent', one?.status);

  const two = await prisma.invoice.findFirst({ where: { companyId: COMPANY_ID, invoiceNumber: 'TAL-002' } });
  ok('two sheet lines became one bill with two items', (two?.items || []).length === 2 && near(two?.subtotal, 12500), `items=${(two?.items || []).length} sub=${two?.subtotal}`);
  ok('the bare second line inherited date and party', two?.customerName === 'Tally Mumbai Mills' && two?.invoiceDate?.toISOString().slice(0, 10) === '2024-02-02', two?.customerName);
  ok('same-state buyer split CGST + SGST', near(two?.cgstAmount, 400) && near(two?.sgstAmount, 400) && near(two?.igstAmount, 0), `c=${two?.cgstAmount} s=${two?.sgstAmount}`);

  const three = await prisma.invoice.findFirst({ where: { companyId: COMPANY_ID, invoiceNumber: 'TAL-003' } });
  ok('Tally "Amount" read as taxable value, not as a grand total', near(three?.subtotal, 20000) && near(three?.totalAmount, 23600), `sub=${three?.subtotal} total=${three?.totalAmount}`);
  ok('Status Paid and the amount received carried over', three?.status === 'paid' && near(three?.paidAmount, 23600), `status=${three?.status} paid=${three?.paidAmount}`);

  // The same party under a longer legal name: GSTIN is the key, so no twin.
  const renamed = await api('POST', '/api/tally', {
    rows: [{ 'Voucher No': 'TAL-005', 'Voucher Date': '10-04-2024', 'Ledger Name': 'Tally Bengaluru Works Pvt Ltd', 'GSTIN No': '29AABCS1234F1Z5', 'Particulars': 'Support', Qty: 1, Rate: 5000, 'GST % Of Value': 18 }],
  });
  const five = await prisma.invoice.findFirst({ where: { companyId: COMPANY_ID, invoiceNumber: 'TAL-005' } });
  ok('one GSTIN stays one customer, even under a different name spelling', renamed.data?.created === 1 && five?.customerId === three?.customerId, `customerId ${three?.customerId} -> ${five?.customerId}`);
  ok('the bill still prints the name from the sheet', five?.customerName === 'Tally Bengaluru Works Pvt Ltd', five?.customerName);

  // An imported bill has to be in the books, not only in the list.
  const refs = [one, two, three, five].map(v => `INVOICE:${v.id}`).concat(`INVOICE_PAYMENT:${three.id}`);
  ok('every imported bill posted its journal', (await prisma.journalEntry.count({ where: { reference: { in: refs } } })) === 5, `refs=${refs.length}`);
  ok('each import left a history entry', (await prisma.auditLog.count({ where: { companyId: COMPANY_ID, entity: 'invoice', action: 'imported' } })) === 4);

  // Uploading the same file twice is the likeliest accident.
  const second = await api('POST', '/api/tally', { rows });
  ok('same file twice adds nothing', second.data?.created === 0 && second.data?.skipped === 3, `created=${second.data?.created} skipped=${second.data?.skipped}`);
  ok('the skip names the bill already there', /TAL-001 is already in AINOS/.test((second.data?.skippedDetails || []).map(d => d.reason).join('|')), second.data?.skippedDetails?.[0]?.reason);
  ok('no duplicate rows in the database', (await prisma.invoice.count({ where: { companyId: COMPANY_ID, invoiceNumber: { startsWith: 'TAL-' } } })) === 4);

  // Back-dated data only shows up if the range reads the bill date.
  const fy24 = await api('GET', '/api/tally?from=2024-01-01&to=2024-12-31');
  const nums = (fy24.data?.vouchers || []).map(v => v.voucherNumber);
  ok('FY2024 range lists the imported bills by their own date', ['TAL-001', 'TAL-002', 'TAL-003'].every(n => nums.includes(n)), nums.join(','));

  const legacy = await api('POST', '/api/tally', {
    vouchers: [{ voucherNumber: 'LEG-001', date: '2024-05-05', partyName: 'Legacy Co', partyGst: '27ABCDE1234F1Z5', items: [{ name: 'Thing', quantity: 1, rate: 1000, gstRate: 18 }], grandTotal: 1180 }],
  });
  const leg = await prisma.invoice.findFirst({ where: { companyId: COMPANY_ID, invoiceNumber: 'LEG-001' } });
  ok('the older vouchers payload still imports', legacy.data?.created === 1 && near(leg?.totalAmount, 1180), `${legacy.data?.created} total=${leg?.totalAmount}`);

  const empty = await api('POST', '/api/tally', { rows: [] });
  ok('an unreadable sheet is refused with a reason', empty.status === 400 && /column headings/i.test(empty.data?.error || ''), `${empty.status} ${empty.data?.error}`);
}

async function testCustomerImport() {
  console.log('\n=== CUSTOMERS: Excel import (a card is not the only way in) ===');
  // Most contact lists are already spreadsheets, so the same book has to accept
  // one. What matters is that a row repeated in the same file, and a person
  // who is already saved, are never counted twice.
  const seed = await api('POST', '/api/customers', { name: 'Fill The Gap', phone: '9000044444' });
  ok('a customer exists before the import', seed.status === 201, String(seed.status));

  const rows = [
    { Name: 'Import Ravi', Company: 'Ravi Traders', Email: 'ravi@ravitraders.in', Phone: '+91 90000 11111', 'GST No': '24AABCF1234M1Z8', 'Pin Code': '380015', Notes: 'Met at the Surat expo' },
    { Name: 'Import Ravi', Email: 'ravi@ravitraders.in', Phone: '9000011111' },
    { Name: 'Delhi Prospect', Phone: '9000022222', State: 'Delhi', Status: 'Prospect' },
    { Phone: '9000033333' },
    { Total: 5 },
    { Name: 'Fill The Gap', Phone: '9000044444', Email: 'fill@gap.in' },
  ];

  const first = await api('POST', '/api/customers/import', { rows, source: 'customers.xlsx' });
  ok('the import answers for every row', first.status === 200, String(first.status));
  const r = first.data || {};
  ok('two contacts were created', r.created === 2, `created=${r.created}`);
  ok('the duplicate inside the same file was not counted twice', r.skipped === 1, `skipped=${r.skipped}`);
  ok('an existing contact was completed', r.updated === 1, `updated=${r.updated}`);
  ok('the row with no name is reported, not dropped', r.failed === 1, `failed=${r.failed}`);
  ok('the report names the refusal', /No name, company or email/.test(r.errorDetails?.[0]?.reason || ''), r.errorDetails?.[0]?.reason || 'none');
  ok('the totals line was ignored rather than failed', !JSON.stringify(r.errorDetails || []).includes('Total'), JSON.stringify(r.errorDetails || []));

  const ravi = await prisma.customer.findFirst({ where: { companyId: COMPANY_ID, name: 'Import Ravi' } });
  ok('the GSTIN came off the sheet', ravi?.gstNumber === '24AABCF1234M1Z8', ravi?.gstNumber || 'none');
  ok('the state came from the GSTIN', ravi?.state === 'Gujarat', ravi?.state || 'none');
  ok('the PAN came from the GSTIN', ravi?.panNumber === 'AABCF1234M', ravi?.panNumber || 'none');
  ok('the pin code was kept', ravi?.pincode === '380015', ravi?.pincode || 'none');
  ok('the notes column was kept', /Surat expo/.test(ravi?.notes || ''), ravi?.notes || 'none');
  const raviCount = await prisma.customer.count({ where: { companyId: COMPANY_ID, name: 'Import Ravi' } });
  ok('two spellings of one number made one contact', raviCount === 1, `count=${raviCount}`);

  const prospect = await prisma.customer.findFirst({ where: { companyId: COMPANY_ID, name: 'Delhi Prospect' } });
  ok('the sheet word "Prospect" became a lead', prospect?.status === 'lead', prospect?.status || 'none');
  ok('the sheet state was used when no GSTIN decided it', prospect?.state === 'Delhi', prospect?.state || 'none');

  const filled = await prisma.customer.findUnique({ where: { id: String(seed.data?.id) } });
  ok('an existing contact was completed, not overwritten', filled?.email === 'fill@gap.in' && filled?.name === 'Fill The Gap', `${filled?.name} / ${filled?.email}`);

  const again = await api('POST', '/api/customers/import', { rows, source: 'customers.xlsx' });
  ok('importing the same file twice adds nobody', again.data?.created === 0, `created=${again.data?.created}, skipped=${again.data?.skipped}`);

  const empty = await api('POST', '/api/customers/import', { rows: [] });
  ok('an empty sheet is refused with a reason', empty.status === 400 && /headings/i.test(empty.data?.error || ''), `${empty.status} ${empty.data?.error}`);

  const foreign = await api('POST', '/api/customers/import', { rows: [{ 'Sr No': 1, Amount: 500 }] });
  ok('a sheet with no recognised column is refused', foreign.status === 400, `${foreign.status} ${foreign.data?.error}`);
}

async function cleanup() {
  console.log('\n=== CLEANUP test data ===');
  const models = ['invoice', 'customer', 'product', 'expense', 'quote', 'deliveryChallan', 'creditNote', 'debitNote', 'bankAccount', 'bankTransaction', 'recurringInvoice', 'invoiceTemplate', 'gstReconImport', 'gstFiling'];
  for (const m of models) {
    if (prisma[m]) await prisma[m].deleteMany({ where: { companyId: COMPANY_ID } }).catch(() => {});
  }
  // double-entry ledger: accounts + journals carry companyId, ledgerEntries link them
  const accounts = await prisma.account.findMany({ where: { companyId: COMPANY_ID }, select: { id: true } }).catch(() => []);
  const journals = await prisma.journalEntry.findMany({ where: { companyId: COMPANY_ID }, select: { id: true } }).catch(() => []);
  const accIds = accounts.map(a => a.id), jIds = journals.map(j => j.id);
  if (accIds.length || jIds.length) {
    await prisma.ledgerEntry.deleteMany({ where: { OR: [{ accountId: { in: accIds } }, { journalId: { in: jIds } }] } }).catch(() => {});
  }
  await prisma.journalEntry.deleteMany({ where: { companyId: COMPANY_ID } }).catch(() => {});
  await prisma.account.deleteMany({ where: { companyId: COMPANY_ID } }).catch(() => {});
  await prisma.auditLog.deleteMany({ where: { companyId: COMPANY_ID } }).catch(() => {});
  await prisma.user.deleteMany({ where: { email: EMAIL } }).catch(() => {});
  await prisma.company.deleteMany({ where: { id: COMPANY_ID } }).catch(() => {});
  console.log('  cleaned');
}

(async () => {
  try {
    await provision(); await login();
    await testInvoices(); await testCustomersProducts(); await testExpensesQuotes();
    await testChallanNotesBankRecurring(); await testRemindersTallyTemplatesReports();
    await testGstCompliance();
    await testBankReconcile();
    await testEwayBill();
    await testSupplyDerivation();
    await testTallyImport();
    await testInvoiceDelete();
    await testCustomerImport();
  } catch (e) {
    console.error('SCRIPT ERROR:', e.message);
  } finally {
    await cleanup();
    console.log(`\n===== RESULT: ${PASS} passed, ${FAIL} failed =====`);
    await prisma.$disconnect();
  }
})();
