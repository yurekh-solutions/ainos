// AINOS credit sale path — proves the money path end to end.
//
//   node --env-file=.env scripts/_saleFlow.cjs closed   (server started WITHOUT Razorpay env)
//   node --env-file=.env scripts/_saleFlow.cjs full     (server started WITH the test secrets below)
//
// "closed"  : checkout refuses to sell, webhook refuses every unverifiable call.
// "full"    : signed webhook settles once, retries/replays/refunds never credit twice,
//             /api/billing/verify settles once, AI runs deduct exactly their catalogue cost.
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const BASE = 'http://localhost:3000';
const MODE = process.argv[2] || 'full';

// Must match the values the dev server was started with.
const WEBHOOK_SECRET = 'whsec_saleflow_local';
const KEY_SECRET = 'rzp_secret_saleflow_local';

// Payment ids are globally unique forever, so each run needs its own set —
// reusing them is exactly what the payment_reused guard is there to stop.
const RUN = String(Date.now());
const PAY = {
  a: `pay_sf_a_${RUN}`, b: `pay_sf_b_${RUN}`, c: `pay_sf_c_${RUN}`,
  d: `pay_sf_d_${RUN}`, e: `pay_sf_e_${RUN}`, zzz: `pay_sf_zzz_${RUN}`,
};

const results = [];
let cookie = '';

function pass(name, detail = '') {
  results.push({ name, pass: true });
  console.log(`[PASS] ${name}${detail ? ' -> ' + detail : ''}`);
}
function fail(name, detail = '') {
  results.push({ name, pass: false });
  console.log(`[FAIL] ${name}${detail ? ' -> ' + detail : ''}`);
}
function expect(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  ok ? pass(name, JSON.stringify(actual)) : fail(name, `got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`);
  return ok;
}

async function req(method, path, body, { raw = false, headers = {} } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', Cookie: cookie, ...headers },
    body: body === undefined ? undefined : raw ? body : JSON.stringify(body),
    redirect: 'manual',
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text: text.slice(0, 400) };
}

const sign = (body, secret) => crypto.createHmac('sha256', secret).update(body).digest('hex');

function webhook(event) {
  const body = JSON.stringify(event);
  return req('POST', '/api/webhooks/razorpay', body, {
    raw: true,
    headers: { 'x-razorpay-signature': sign(body, WEBHOOK_SECRET) },
  });
}

const captured = (orderId, paymentId, amount) => ({
  event: 'payment.captured',
  payload: { payment: { entity: { id: paymentId, order_id: orderId, amount, currency: 'INR', status: 'captured' } } },
});

async function login(email, password) {
  const csrfRes = await fetch(BASE + '/api/auth/csrf');
  const jar = {};
  for (const c of csrfRes.headers.getSetCookie()) {
    const [kv] = c.split(';'); const [k, ...v] = kv.split('='); jar[k.trim()] = v.join('=');
  }
  const csrf = (await csrfRes.json()).csrfToken;
  const loginRes = await fetch(BASE + '/api/auth/callback/credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; '),
    },
    body: new URLSearchParams({ csrfToken: csrf, email, password, callbackUrl: BASE + '/dashboard', json: 'true' }),
    redirect: 'manual',
  });
  for (const c of loginRes.headers.getSetCookie()) {
    const [kv] = c.split(';'); const [k, ...v] = kv.split('='); jar[k.trim()] = v.join('=');
  }
  cookie = Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ');
  const sess = await req('GET', '/api/auth/session');
  return Boolean(sess.json?.user?.email);
}

/** Seeds a fresh tenant plus the orgs needed for the cross-company check. */
async function seedTenant() {
  const stamp = Date.now();
  const email = `saleflow${stamp}@example.com`;
  const password = 'testpass123';
  const hash = await bcrypt.hash(password, 10);
  const company = await prisma.company.create({
    data: {
      name: `SaleFlow Co ${stamp}`, companyType: 'Private Limited', email,
      phone: '9876500000', address: 'Test Address', country: 'India',
      createdBy: 'SALEFLOW', onboardingStatus: 'approved',
    },
  });
  await prisma.user.create({
    data: { email, name: 'SaleFlow Owner', password: hash, role: 'owner', companyId: company.id, emailVerifiedAt: new Date() },
  });
  await prisma.creditBalance.create({ data: { companyId: company.id, balance: 0 } });
  const other = await prisma.company.create({
    data: {
      name: `SaleFlow Other ${stamp}`, companyType: 'Private Limited', email: `other${stamp}@example.com`,
      phone: '9876500001', address: 'Other Address', country: 'India',
      createdBy: 'SALEFLOW', onboardingStatus: 'approved',
    },
  });
  return { companyId: company.id, otherCompanyId: other.id, email, password };
}

async function makePurchase(companyId, { credits, amountMinor, tag }) {
  return prisma.creditPurchase.create({
    data: {
      orderId: `order_${tag}_${Date.now()}`,
      companyId, credits, amountMinor, currency: 'INR',
      displayUsd: Math.round((amountMinor / 100 / 88) * 100) / 100,
    },
  });
}

const balanceOf = async (companyId) =>
  (await prisma.creditBalance.findUnique({ where: { companyId }, select: { balance: true } }))?.balance ?? null;

async function runClosed(companyId) {
  console.log('\n--- fail-closed (no Razorpay keys on the server) ---');
  const checkout = await req('POST', '/api/billing/checkout', { creditPackId: 500 });
  expect('checkout refuses to sell without keys (503)', checkout.status, 503);

  const unsigned = await req('POST', '/api/webhooks/razorpay', JSON.stringify(captured('x', 'y', 1)), { raw: true });
  expect('webhook rejects unsigned call (401)', unsigned.status, 401);

  const forged = await req('POST', '/api/webhooks/razorpay', JSON.stringify(captured('x', 'y', 1)), {
    raw: true, headers: { 'x-razorpay-signature': 'deadbeef' },
  });
  expect('webhook rejects forged signature (401)', forged.status, 401);

  const catalogue = await req('GET', '/api/billing/checkout');
  const inr = Object.fromEntries((catalogue.json || []).map((p) => [p.credits, p.amountInr]));
  expect('catalogue publishes INR price (USD x 88)', [inr[100], inr[500], inr[2000], inr[5000], inr[10000]], [132, 440, 1320, 3080, 5280]);

  expect('wallet untouched by refused calls', await balanceOf(companyId), 0);
}

async function runFull(companyId, otherCompanyId) {
  console.log('\n--- settlement ---');
  const p1 = await makePurchase(companyId, { credits: 500, amountMinor: 44000, tag: 'p1' });

  const first = await webhook(captured(p1.orderId, PAY.a, 44000));
  expect('capture credits the wallet once', [first.status, first.json?.status, first.json?.credited, first.json?.alreadyPaid], [200, 'ok', 500, false]);
  expect('wallet balance after capture', await balanceOf(companyId), 500);

  const retry = await webhook(captured(p1.orderId, PAY.a, 44000));
  expect('webhook retry is a no-op', [retry.json?.status, retry.json?.credited, retry.json?.alreadyPaid], ['ok', 0, true]);
  expect('wallet balance unchanged by retry', await balanceOf(companyId), 500);

  const otherPayment = await webhook(captured(p1.orderId, PAY.zzz, 44000));
  expect('a second payment id cannot re-settle the order', [otherPayment.json?.status, otherPayment.json?.credited], ['ok', 0]);
  expect('wallet unchanged by second payment id', await balanceOf(companyId), 500);

  const walletTx = await prisma.creditTransaction.count({ where: { companyId, type: 'credit', amount: 500 } });
  expect('exactly one credit ledger entry for the purchase', walletTx, 1);

  console.log('\n--- rejects bad deliveries ---');
  const p2 = await makePurchase(companyId, { credits: 100, amountMinor: 13200, tag: 'p2' });
  const mismatch = await webhook(captured(p2.orderId, PAY.b, 999));
  expect('amount mismatch is refused', [mismatch.status, mismatch.json?.reason], [200, 'amount_mismatch']);
  expect('mismatched order stays created', (await prisma.creditPurchase.findUnique({ where: { orderId: p2.orderId } }))?.status, 'created');
  expect('wallet unchanged by mismatch', await balanceOf(companyId), 500);

  const unknown = await webhook(captured('order_does_not_exist', PAY.c, 100));
  expect('unknown order is ignored', [unknown.status, unknown.json?.reason], [200, 'unknown_order']);

  const p3 = await makePurchase(companyId, { credits: 2000, amountMinor: 132000, tag: 'p3' });
  const reused = await webhook(captured(p3.orderId, PAY.a, 132000));
  expect('a payment id cannot fund two orders', [reused.status, reused.json?.reason], [200, 'payment_reused']);
  expect('reused-payment order stays created', (await prisma.creditPurchase.findUnique({ where: { orderId: p3.orderId } }))?.status, 'created');
  expect('wallet unchanged by payment reuse', await balanceOf(companyId), 500);

  const badSig = await req('POST', '/api/webhooks/razorpay', JSON.stringify(captured(p2.orderId, PAY.b, 13200)), {
    raw: true, headers: { 'x-razorpay-signature': 'a'.repeat(64) },
  });
  expect('wrong signature refused', badSig.status, 401);

  console.log('\n--- refund safety ---');
  const refund = await webhook({
    event: 'refund.created',
    payload: { refund: { entity: { id: 'rfnd_saleflow_a', payment_id: PAY.a, amount: 44000 } } },
  });
  expect('refund event never credits', [refund.status, refund.json?.status], [200, 'ignored']);
  const afterRefund = await webhook(captured(p1.orderId, PAY.a, 44000));
  expect('capture replayed after refund still grants nothing', [afterRefund.json?.status, afterRefund.json?.credited], ['ok', 0]);
  expect('wallet unchanged by refund replay', await balanceOf(companyId), 500);

  console.log('\n--- browser confirmation (/api/billing/verify) ---');
  const p4 = await makePurchase(companyId, { credits: 100, amountMinor: 13200, tag: 'p4' });
  const sig = sign(`${p4.orderId}|${PAY.d}`, KEY_SECRET);
  const verify = await req('POST', '/api/billing/verify', {
    razorpay_order_id: p4.orderId, razorpay_payment_id: PAY.d, razorpay_signature: sig,
  });
  expect('verify settles a signed payment', [verify.status, verify.json?.credits, verify.json?.balance], [200, 100, 600]);
  const verifyReplay = await req('POST', '/api/billing/verify', {
    razorpay_order_id: p4.orderId, razorpay_payment_id: PAY.d, razorpay_signature: sig,
  });
  expect('verify replay is a no-op', [verifyReplay.status, verifyReplay.json?.alreadyPaid, verifyReplay.json?.credits], [200, true, 0]);
  expect('wallet after verify + replay', await balanceOf(companyId), 600);

  const verifyBad = await req('POST', '/api/billing/verify', {
    razorpay_order_id: p4.orderId, razorpay_payment_id: PAY.d, razorpay_signature: 'b'.repeat(64),
  });
  expect('verify rejects a wrong signature (400)', verifyBad.status, 400);

  const foreign = await makePurchase(otherCompanyId, { credits: 5000, amountMinor: 308000, tag: 'foreign' });
  const foreignSig = sign(`${foreign.orderId}|${PAY.e}`, KEY_SECRET);
  const crossTenant = await req('POST', '/api/billing/verify', {
    razorpay_order_id: foreign.orderId, razorpay_payment_id: PAY.e, razorpay_signature: foreignSig,
  });
  expect("another company's order is invisible (404)", crossTenant.status, 404);
  expect('foreign company has no wallet row', await prisma.creditBalance.count({ where: { companyId: otherCompanyId } }), 0);
  expect('foreign company has no ledger entries', await prisma.creditTransaction.count({ where: { companyId: otherCompanyId } }), 0);
  const foreignUnpaid = await prisma.creditPurchase.findUnique({ where: { orderId: foreign.orderId } });
  expect('foreign order not marked paid', foreignUnpaid?.status, 'created');

  console.log('\n--- AI metering ---');
  // Pay exactly for one qr run (1 credit) and prove the gate and the deduction.
  await prisma.creditBalance.update({ where: { companyId }, data: { balance: 1 } });
  const qr = await req('POST', '/api/ai-tools', { tool: 'qr', inputs: { businessName: 'SaleFlow Test' } });
  expect('ai-tools qr succeeds on 1 credit', [qr.status, qr.json?.creditsUsed, qr.json?.creditsBalance], [200, 1, 0]);
  expect('wallet drained by the exact catalogue cost', await balanceOf(companyId), 0);

  const blocked = await req('POST', '/api/ai-tools', { tool: 'qr', inputs: { businessName: 'SaleFlow Test' } });
  expect('empty wallet is refused before the provider call (402)', [blocked.status, blocked.json?.creditsRequired, blocked.json?.balance], [402, 1, 0]);

  await prisma.creditBalance.update({ where: { companyId }, data: { balance: 1000 } });
  const expensive = await req('POST', '/api/ai-tools', { tool: 'bizplan', inputs: { businessName: 'SaleFlow Test', description: 'A test company' } });
  const expensiveOk = expensive.status === 200;
  expect('expensive tool charges its own price', [expensive.status, expensive.json?.creditsUsed], [200, 30]);
  if (expensiveOk) expect('wallet after expensive tool', await balanceOf(companyId), 970);
  else console.log('  body:', expensive.text);

  // The old free-taste cap was 3 runs/month; a paying customer must not hit it.
  const repeat = [];
  for (let i = 0; i < 4; i++) {
    const run = await req('POST', '/api/ai-tools', { tool: 'qr', inputs: { businessName: 'SaleFlow Test' } });
    repeat.push(run.status);
  }
  expect('paying customers are not capped at 3 runs/month', repeat, [200, 200, 200, 200]);
  if (expensiveOk) expect('wallet reflects four more paid runs', await balanceOf(companyId), 966);

  const debits = await prisma.creditTransaction.findMany({
    where: { companyId, type: 'debit' }, select: { amount: true },
  });
  const spent = debits.reduce((sum, d) => sum + Math.abs(d.amount), 0);
  expect('debit ledger records every paid run', [debits.length, spent], expensiveOk ? [6, 35] : [5, 5]);
}

async function main() {
  console.log(`AINOS sale flow [${MODE}] against ${BASE}`);
  const { companyId, otherCompanyId, email, password } = await seedTenant();
  pass('seeded tenant', companyId);

  if (!(await login(email, password))) {
    fail('login');
    return report();
  }
  pass('logged in as tenant owner');

  (await req('GET', '/api/health')).status === 200 ? pass('health') : fail('health');

  if (MODE === 'closed') await runClosed(companyId);
  else await runFull(companyId, otherCompanyId);

  report();
}

function report() {
  const passed = results.filter((r) => r.pass).length;
  console.log(`\n${passed}/${results.length} checks passed`);
  if (passed !== results.length) {
    console.log('failed:', results.filter((r) => !r.pass).map((r) => r.name).join(' | '));
    process.exitCode = 1;
  }
}

main()
  .catch((e) => { console.error('ABORT', e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
