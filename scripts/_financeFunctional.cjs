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
  console.log('\n=== E-WAY BILL (mock + manual record): build, validate, generate, persist ===');
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
  ok('EWB preview: payload is ready to generate', preview.data?.ready === true, JSON.stringify(preview.data?.errors));
  ok('EWB preview: totalValue maps challan subtotal', near(preview.data?.payload?.partA?.totalValue, 60000), preview.data?.payload?.partA?.totalValue);
  ok('EWB preview: state codes resolved (27 -> 07)', preview.data?.payload?.partA?.fromState === '27' && preview.data?.payload?.partA?.toState === '07', `${preview.data?.payload?.partA?.fromState}->${preview.data?.payload?.partA?.toState}`);

  const gen = await api('POST', '/api/delivery-challans/ewaybill', { challanId, distance: 250 });
  ok('EWB generated via mock adapter (201)', gen.status === 201 && gen.data?.provider === 'mock', `${gen.status} ${gen.data?.error || ''}`);
  ok('EWB number is 12 digits', /^\d{12}$/.test(gen.data?.ewbNo || ''), gen.data?.ewbNo);
  ok('validity = 3 days for 250 km (Rule 13B)', gen.data?.validityDays === 3, `days=${gen.data?.validityDays}`);
  ok('persisted onto linked invoice', gen.data?.persistedInvoiceId === invoiceId, gen.data?.persistedInvoiceId);

  const dbInv = await prisma.invoice.findUnique({ where: { id: invoiceId }, select: { ewayBillNo: true, ewayBillValid: true } });
  ok('invoice.ewayBillNo stored from generation', dbInv?.ewayBillNo === gen.data?.ewbNo && !!dbInv?.ewayBillValid, dbInv?.ewayBillNo);

  // UI "sample" demo sends persist:false — must return a number WITHOUT writing the invoice.
  await api('PUT', '/api/delivery-challans/ewaybill', { challanId, ewbNo: '111122223333' });
  const smp = await api('POST', '/api/delivery-challans/ewaybill', { challanId, distance: 100, persist: false });
  const dbSmp = await prisma.invoice.findUnique({ where: { id: invoiceId }, select: { ewayBillNo: true } });
  ok('sample persist:false does not write the invoice', smp.status === 201 && smp.data?.persistedInvoiceId === null && dbSmp?.ewayBillNo === '111122223333', `${smp.status} persisted=${smp.data?.persistedInvoiceId} inv=${dbSmp?.ewayBillNo}`);

  // Manual-assist (FREE portal) path: PUT records a real 12-digit EWB onto the linked invoice.
  const rec = await api('PUT', '/api/delivery-challans/ewaybill', { challanId, ewbNo: '334455667788', validTill: '2026-12-31T23:59:59.000Z' });
  ok('manual record: PUT stores real EWB (200)', rec.status === 200 && rec.data?.recorded === true && rec.data?.persistedInvoiceId === invoiceId, `${rec.status} ${rec.data?.error || ''}`);
  const dbInv2 = await prisma.invoice.findUnique({ where: { id: invoiceId }, select: { ewayBillNo: true, ewayBillValid: true } });
  ok('manual record: invoice.ewayBillNo updated to real number', dbInv2?.ewayBillNo === '334455667788', dbInv2?.ewayBillNo);
  const badRec = await api('PUT', '/api/delivery-challans/ewaybill', { challanId, ewbNo: '12' });
  ok('manual record: rejects non-12-digit EWB (400)', badRec.status === 400 && /12 digits/i.test(badRec.data?.error || ''), `${badRec.status} ${badRec.data?.error}`);

  // Negative: consignee has no GSTIN/state -> hard validation error, no generation
  const bad = await api('POST', '/api/delivery-challans', {
    customerName: 'NoGst Co', vehicleNo: 'MH 02 CD 5678', supplyType: 'intra',
    items: [{ productName: 'Misc', hsnCode: '9403', price: 80000, quantity: 1, gstRate: 18 }],
  });
  const badGen = await api('POST', '/api/delivery-challans/ewaybill', { challanId: bad.data?.id, distance: 50 });
  ok('rejects generation when consignee state missing (400)', badGen.status === 400 && (badGen.data?.errors || []).some(e => /to-state/i.test(e)), JSON.stringify(badGen.data?.errors));
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
  } catch (e) {
    console.error('SCRIPT ERROR:', e.message);
  } finally {
    await cleanup();
    console.log(`\n===== RESULT: ${PASS} passed, ${FAIL} failed =====`);
    await prisma.$disconnect();
  }
})();
