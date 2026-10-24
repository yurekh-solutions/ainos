// Documents + Repair + Recurring invoices + Follow-ups + Debit notes E2E.
// Run: node --env-file=.env scripts/_modulesE2E.cjs
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const BASE = 'http://localhost:3000';
const stamp = Date.now();
const OWNER_EMAIL = `qa.mods.${stamp}@ainos-test.com`;
const PLAIN_EMAIL = `qa.mods.plain.${stamp}@ainos-test.com`;
const PASSWORD = 'ModsQa12345';
const results = [];
let cookie = '';

async function req(method, path, body, overrideCookie) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', Cookie: overrideCookie ?? cookie },
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: 'manual',
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, json, text: text.slice(0, 300) };
}

function check(name, actual, expected, detail = '') {
  const pass = actual === expected;
  results.push({ name, pass });
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name} -> ${actual} (want ${expected}) ${pass ? '' : detail}`);
  return pass;
}

async function loginUser(email) {
  const csrfRes = await fetch(BASE + '/api/auth/csrf');
  const { csrfToken } = await csrfRes.json();
  const jar = {};
  for (const entry of csrfRes.headers.getSetCookie()) {
    const [kv] = entry.split(';');
    const [key, ...value] = kv.split('=');
    jar[key.trim()] = value.join('=');
  }
  const jarHeader = () => Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ');

  const loginRes = await fetch(BASE + '/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: jarHeader() },
    body: new URLSearchParams({
      csrfToken,
      email,
      password: PASSWORD,
      callbackUrl: BASE + '/dashboard',
      json: 'true',
    }),
    redirect: 'manual',
  });
  for (const entry of loginRes.headers.getSetCookie()) {
    const [kv] = entry.split(';');
    const [key, ...value] = kv.split('=');
    jar[key.trim()] = value.join('=');
  }
  return jarHeader();
}

async function main() {
  const company = await prisma.company.findFirst({
    where: { onboardingStatus: 'approved' },
    orderBy: { createdAt: 'asc' },
  });
  if (!company) throw new Error('No approved company to attach QA users to');

  const password = await bcrypt.hash(PASSWORD, 10);
  await prisma.user.create({
    data: {
      email: OWNER_EMAIL,
      name: 'QA Modules Owner',
      password,
      role: 'owner',
      companyId: company.id,
      emailVerifiedAt: new Date(),
    },
  });
  await prisma.user.create({
    data: {
      email: PLAIN_EMAIL,
      name: 'QA Modules Plain',
      password,
      role: 'user',
      companyId: company.id,
      emailVerifiedAt: new Date(),
    },
  });

  cookie = await loginUser(OWNER_EMAIL);
  const session = await req('GET', '/api/auth/session');
  check('owner session established', session.json?.user?.email, OWNER_EMAIL);

  const plainCookie = await loginUser(PLAIN_EMAIL);

  // ── Documents ────────────────────────────────────────────────
  const docCreate = await req('POST', '/api/documents', {
    name: `GST certificate ${stamp}`,
    category: 'certificate',
    url: 'https://example.com/gst.pdf',
    expiryDate: new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10),
    notes: 'Renew annually',
  });
  check('documents POST', docCreate.status, 201, docCreate.text);
  const docId = docCreate.json?.document?.id || '';
  check('documents stores expiry', Boolean(docCreate.json?.document?.expiryDate), true);

  const docList = await req('GET', `/api/documents?q=GST%20certificate%20${stamp}`);
  check('documents GET filtered', docList.status, 200, docList.text);
  check('documents summary expiringSoon', docList.json?.summary?.expiringSoon, 1);
  check('documents q finds row', docList.json?.documents?.[0]?.id, docId);
  check('documents daysToExpiry', docList.json?.documents?.[0]?.daysToExpiry, 20);

  const docUpdate = await req('PUT', '/api/documents', {
    id: docId,
    name: `GST certificate ${stamp} v2`,
    category: 'license',
    expiryDate: null,
    notes: 'No expiry',
  });
  check('documents PUT', docUpdate.status, 200, docUpdate.text);
  check('documents PUT name', docUpdate.json?.document?.name, `GST certificate ${stamp} v2`);
  check('documents PUT clears expiry', docUpdate.json?.document?.expiryDate, null);

  const docPlainDelete = await req('DELETE', `/api/documents?id=${docId}`, undefined, plainCookie);
  check('documents DELETE blocked for plain user', docPlainDelete.status, 403);

  const docDelete = await req('DELETE', `/api/documents?id=${docId}`);
  check('documents DELETE owner', docDelete.status, 200, docDelete.text);

  // ── Repair ───────────────────────────────────────────────────
  const repairCreate = await req('POST', '/api/repair', {
    customerName: 'Ravi Kumar',
    customerPhone: '9876543210',
    deviceName: 'HP LaserJet 1020',
    serialNumber: `SN-${stamp}`,
    priority: 'high',
    technician: 'Imran',
    promisedAt: new Date(Date.now() + 2 * 86400000).toISOString(),
    issue: 'Paper jam and streaks',
    lines: [
      { kind: 'part', description: 'Fuser assembly', quantity: 2, unitPrice: 150 },
      { kind: 'labor', description: 'Service charge', quantity: 1, unitPrice: 500 },
    ],
  });
  check('repair POST', repairCreate.status, 201, repairCreate.text);
  const repairId = repairCreate.json?.order?.id || '';
  check('repair order number format', /^RO-\d{4}-\d{4}$/.test(repairCreate.json?.order?.orderNumber || ''), true);
  check('repair partsCost derived', repairCreate.json?.order?.partsCost, 300);
  check('repair laborCost derived', repairCreate.json?.order?.laborCost, 500);
  check('repair totalCost derived', repairCreate.json?.order?.totalCost, 800);
  check('repair line count', repairCreate.json?.order?.lines?.length, 2);
  check('repair default status', repairCreate.json?.order?.status, 'received');

  const repairMissing = await req('POST', '/api/repair', { customerName: 'No device' });
  check('repair POST requires device', repairMissing.status, 400);

  const repairGet = await req('GET', `/api/repair?id=${repairId}`);
  check('repair GET single', repairGet.status, 200, repairGet.text);
  check('repair GET single id', repairGet.json?.order?.id, repairId);

  const repairReady = await req('PUT', '/api/repair', { id: repairId, status: 'ready' });
  check('repair PUT ready', repairReady.status, 200, repairReady.text);
  check('repair completedAt stamped', Boolean(repairReady.json?.order?.completedAt), true);
  check('repair deliveredAt null while ready', repairReady.json?.order?.deliveredAt, null);

  const repairDelivered = await req('PUT', '/api/repair', { id: repairId, status: 'delivered' });
  check('repair PUT delivered', repairDelivered.status, 200, repairDelivered.text);
  check('repair deliveredAt stamped', Boolean(repairDelivered.json?.order?.deliveredAt), true);

  const repairLines = await req('PUT', '/api/repair', {
    id: repairId,
    lines: [
      { kind: 'part', description: 'Fuser assembly', quantity: 1, unitPrice: 150 },
      { kind: 'part', description: 'Pickup roller', quantity: 1, unitPrice: 50 },
      { kind: 'service', description: 'On-site visit', quantity: 2, unitPrice: 200 },
    ],
  });
  check('repair PUT replaces lines', repairLines.json?.order?.lines?.length, 3);
  check('repair partsCost after edit', repairLines.json?.order?.partsCost, 200);
  check('repair laborCost after edit', repairLines.json?.order?.laborCost, 400);
  check('repair totalCost after edit', repairLines.json?.order?.totalCost, 600);

  const repairList = await req('GET', '/api/repair?status=delivered');
  check('repair GET filter', repairList.status, 200, repairList.text);
  check('repair list has order', repairList.json?.orders?.some((row) => row.id === repairId), true);
  check('repair summary deliveredMonth >= 1', (repairList.json?.summary?.deliveredMonth || 0) >= 1, true);

  const repairPlainDelete = await req('DELETE', `/api/repair?id=${repairId}`, undefined, plainCookie);
  check('repair DELETE blocked for plain user', repairPlainDelete.status, 403);

  const repairDelete = await req('DELETE', `/api/repair?id=${repairId}`);
  check('repair DELETE owner', repairDelete.status, 200, repairDelete.text);

  const repairGone = await req('GET', `/api/repair?id=${repairId}`);
  check('repair GET after delete', repairGone.status, 404);

  // ── Recurring invoices ───────────────────────────────────────
  const recCreate = await req('POST', '/api/recurring-invoices', {
    customerName: 'Acme Industries',
    frequency: 'monthly',
    startDate: new Date().toISOString().slice(0, 10),
    items: [{ description: 'Retainer', quantity: 1, rate: 25000, amount: 25000 }],
    notes: 'Net 15',
  });
  check('recurring POST', recCreate.status, 201, recCreate.text);
  const recId = recCreate.json?.id || '';
  check('recurring default status', recCreate.json?.status, 'active');

  const recPause = await req('PATCH', '/api/recurring-invoices', { id: recId, status: 'paused' });
  check('recurring PATCH pause', recPause.json?.status, 'paused');

  const recResume = await req('PATCH', '/api/recurring-invoices', { id: recId, status: 'active' });
  check('recurring PATCH resume', recResume.json?.status, 'active');

  const before = recResume.json?.nextRunDate ? new Date(recResume.json.nextRunDate).getTime() : 0;
  const recRunNow = await req('PATCH', '/api/recurring-invoices', { id: recId, runNow: true });
  const after = recRunNow.json?.nextRunDate ? new Date(recRunNow.json.nextRunDate).getTime() : 0;
  check('recurring runNow advances', after > before, true);

  const recInvalid = await req('PATCH', '/api/recurring-invoices', { id: recId, status: 'nonsense' });
  check('recurring PATCH invalid status', recInvalid.status, 400);

  const recDelete = await req('DELETE', `/api/recurring-invoices?id=${recId}`);
  check('recurring DELETE', recDelete.status, 200, recDelete.text);

  const recDeleteAgain = await req('DELETE', `/api/recurring-invoices?id=${recId}`);
  check('recurring DELETE missing', recDeleteAgain.status, 404);

  // ── Follow-ups ───────────────────────────────────────────────
  const fuCreate = await req('POST', '/api/follow-ups', {
    contactName: 'Meera Sharma',
    type: 'whatsapp',
    dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    notes: 'Share revised quote',
  });
  check('follow-up POST', fuCreate.status, 201, fuCreate.text);
  const fuId = fuCreate.json?.id || '';
  check('follow-up stores contactName', fuCreate.json?.contactName, 'Meera Sharma');
  check('follow-up stores dueDate', Boolean(fuCreate.json?.dueDate), true);

  const fuDone = await req('PATCH', '/api/follow-ups', { id: fuId, status: 'done' });
  check('follow-up PATCH done', fuDone.json?.status, 'done');

  const fuList = await req('GET', '/api/follow-ups?status=done');
  check('follow-up GET filter', fuList.json?.some((row) => row.id === fuId), true);

  const fuInvalid = await req('PATCH', '/api/follow-ups', { id: fuId, status: 'bogus' });
  check('follow-up PATCH invalid status', fuInvalid.status, 400);

  const fuDelete = await req('DELETE', `/api/follow-ups?id=${fuId}`);
  check('follow-up DELETE', fuDelete.status, 200, fuDelete.text);

  // ── Debit notes ──────────────────────────────────────────────
  const dnCreate = await req('POST', '/api/debit-notes', {
    vendorName: 'Sky Vision Traders',
    reason: 'Damaged goods returned',
    status: 'posted',
    items: [{ description: 'Returned toner', quantity: 2, rate: 500, amount: 1000 }],
    subtotal: 1000,
    tax: 180,
    cgstAmount: 90,
    sgstAmount: 90,
    total: 1180,
  });
  check('debit note POST', dnCreate.status, 201, dnCreate.text);
  const dnId = dnCreate.json?.id || '';
  check('debit note number format', /^DN-\d{4}-\d{4}$/.test(dnCreate.json?.noteNumber || ''), true);
  check('debit note total', dnCreate.json?.total, 1180);

  const dnList = await req('GET', '/api/debit-notes');
  check('debit note GET contains row', dnList.json?.some((row) => row.id === dnId), true);

  // ── Invoices PUT accepts id in body ──────────────────────────
  const invoicePut = await req('PUT', '/api/invoices', { id: 'definitely-not-a-real-invoice', status: 'paid' });
  check('invoices PUT parses body id', invoicePut.status, 404);

  // ── Auth guards ──────────────────────────────────────────────
  const anonDocs = await req('GET', '/api/documents', undefined, '');
  check('documents requires auth', anonDocs.status, 401);
  const anonRepair = await req('GET', '/api/repair', undefined, '');
  check('repair requires auth', anonRepair.status, 401);

  // ── Cleanup ──────────────────────────────────────────────────
  await prisma.repairOrder.deleteMany({ where: { companyId: company.id, customerName: 'Ravi Kumar' } });
  await prisma.document.deleteMany({ where: { companyId: company.id, name: { contains: String(stamp) } } });
  await prisma.debitNote.deleteMany({ where: { companyId: company.id, id: dnId } });
  await prisma.user.deleteMany({ where: { email: { in: [OWNER_EMAIL, PLAIN_EMAIL] } } });

  const passed = results.filter((row) => row.pass).length;
  console.log(`\n${passed}/${results.length} checks passed`);
  if (passed !== results.length) {
    console.log('FAILURES:');
    for (const row of results.filter((item) => !item.pass)) console.log(` - ${row.name}`);
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
