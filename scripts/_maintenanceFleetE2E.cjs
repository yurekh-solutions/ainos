// Maintenance + Fleet E2E — auth, CRUD, permissions, odometer sync, cascade deletes.
// Run: node --env-file=.env scripts/_maintenanceFleetE2E.cjs
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const BASE = 'http://localhost:3000';
const stamp = Date.now();
const EMAIL = `qa.ops.${stamp}@ainos-test.com`;
const PASSWORD = 'OpsQa12345';
const results = [];
let cookie = '';

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
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

async function login() {
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
      email: EMAIL,
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
  cookie = jarHeader();

  const session = await req('GET', '/api/auth/session');
  return session.json?.user?.email === EMAIL;
}

async function main() {
  const company = await prisma.company.findFirst({
    where: { onboardingStatus: 'approved' },
    orderBy: { createdAt: 'asc' },
  });
  if (!company) throw new Error('No approved company to attach the QA user to');

  const user = await prisma.user.create({
    data: {
      email: EMAIL,
      name: 'QA Ops Tester',
      password: await bcrypt.hash(PASSWORD, 10),
      role: 'user',
      companyId: company.id,
      emailVerifiedAt: new Date(),
    },
  });

  const due = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  let assetId = '';
  let taskId = '';
  let vehicleId = '';
  let logId = '';

  try {
    if (!check('login', await login(), true)) throw new Error('login failed');

    // ── Maintenance: assets ───────────────────────────────────────────
    let res = await req('GET', '/api/maintenance/assets');
    check('GET assets', res.status, 200, res.text);
    check('assets list shape', Array.isArray(res.json?.assets), true);
    check('asset summary present', typeof res.json?.summary?.total, 'number');
    check('asset canManage false for plain user', res.json?.canManage, false);

    res = await req('POST', '/api/maintenance/assets', {
      name: `QA DG set ${stamp}`,
      code: 'QA-AST-1',
      category: 'electrical',
      location: 'QA plant',
      serialNumber: 'SN-QA-778',
      status: 'active',
    });
    check('POST asset', res.status, 201, res.text);
    assetId = res.json?.id;
    check('asset name stored', res.json?.name, `QA DG set ${stamp}`);
    check('asset company scoped', res.json?.companyId, company.id);

    res = await req('POST', '/api/maintenance/assets', { name: '' });
    check('reject empty asset name', res.status, 400, res.text);

    res = await req('GET', `/api/maintenance/assets?id=${assetId}`);
    check('GET single asset', res.status, 200, res.text);
    check('single asset matches', res.json?.asset?.id, assetId);

    res = await req('PUT', '/api/maintenance/assets', { id: assetId, location: 'QA plant 2' });
    check('plain user cannot edit asset', res.status, 403, res.text);

    await prisma.user.update({ where: { id: user.id }, data: { role: 'owner' } });

    res = await req('PUT', '/api/maintenance/assets', { id: assetId, location: 'QA plant 2' });
    check('owner edits asset', res.status, 200, res.text);
    check('asset location updated', res.json?.location, 'QA plant 2');

    // ── Maintenance: service tasks ────────────────────────────────────
    res = await req('POST', '/api/maintenance/tasks', { title: 'QA service without asset' });
    check('reject task without asset', res.status, 400, res.text);

    res = await req('POST', '/api/maintenance/tasks', {
      assetId,
      title: `QA quarterly service ${stamp}`,
      type: 'preventive',
      dueAt: due,
      technician: 'QA Vendor',
      cost: 1200,
    });
    check('POST task', res.status, 201, res.text);
    taskId = res.json?.id;
    check('task starts planned', res.json?.status, 'planned');
    check('task asset joined', res.json?.asset?.id, assetId);

    res = await req('GET', `/api/maintenance/tasks?assetId=${assetId}`);
    check('GET tasks by asset', res.status, 200, res.text);
    check('task appears in list', res.json?.tasks?.some((task) => task.id === taskId), true);
    check('task summary present', typeof res.json?.summary?.planned, 'number');

    res = await req('GET', '/api/maintenance/assets');
    const assetRow = res.json?.assets?.find((asset) => asset.id === assetId);
    check('asset openTasks counted', assetRow?.openTasks, 1);
    check('asset nextDue set', Boolean(assetRow?.nextDue), true);

    res = await req('PUT', '/api/maintenance/tasks', { id: taskId, status: 'in_progress' });
    check('task starts', res.status, 200, res.text);
    check('task in progress', res.json?.status, 'in_progress');

    res = await req('PUT', '/api/maintenance/tasks', { id: taskId, status: 'done' });
    check('task completes', res.status, 200, res.text);
    check('completedAt stamped', Boolean(res.json?.completedAt), true);

    res = await req('GET', '/api/maintenance/tasks?status=done');
    check('task status filter', res.json?.tasks?.some((task) => task.id === taskId), true);
    check('done counted this month', res.json?.summary?.doneThisMonth >= 1, true);

    // ── Fleet: vehicles ───────────────────────────────────────────────
    res = await req('GET', '/api/fleet/vehicles');
    check('GET vehicles', res.status, 200, res.text);
    check('vehicles list shape', Array.isArray(res.json?.vehicles), true);
    check('fleet summary present', typeof res.json?.summary?.fuelMonth, 'number');

    res = await req('POST', '/api/fleet/vehicles', {
      name: `QA van ${stamp}`,
      registration: 'mh 12 qa 1234',
      type: 'van',
      driver: 'QA Driver',
      odometer: 15000,
      status: 'active',
    });
    check('POST vehicle', res.status, 201, res.text);
    vehicleId = res.json?.id;
    check('registration normalised', res.json?.registration, 'MH 12 QA 1234');
    check('odometer stored', res.json?.odometer, 15000);

    res = await req('POST', '/api/fleet/vehicles', { name: '' });
    check('reject empty vehicle name', res.status, 400, res.text);

    // ── Fleet: running costs ──────────────────────────────────────────
    res = await req('POST', '/api/fleet/logs', { type: 'fuel', cost: 500 });
    check('reject log without vehicle', res.status, 400, res.text);

    res = await req('POST', '/api/fleet/logs', {
      vehicleId,
      type: 'fuel',
      date: new Date().toISOString(),
      litres: 40,
      cost: 4000,
      odometer: 15400,
      vendor: 'QA Pump',
    });
    check('POST fuel log', res.status, 201, res.text);
    logId = res.json?.id;
    check('fuel type stored', res.json?.type, 'fuel');
    check('litres stored', res.json?.litres, 40);

    res = await req('GET', `/api/fleet/vehicles?id=${vehicleId}`);
    check('GET single vehicle', res.status, 200, res.text);
    check('odometer synced from log', res.json?.vehicle?.odometer, 15400);
    check('vehicle logs included', res.json?.vehicle?.logs?.some((log) => log.id === logId), true);

    res = await req('GET', `/api/fleet/logs?vehicleId=${vehicleId}`);
    check('GET logs by vehicle', res.status, 200, res.text);
    check('log appears in list', res.json?.logs?.some((log) => log.id === logId), true);
    check('fuel cost summarised', res.json?.summary?.fuelCost, 4000);
    check('litres summarised', res.json?.summary?.litres, 40);

    res = await req('PUT', '/api/fleet/logs', { id: logId, cost: 4200 });
    check('edit log cost', res.status, 200, res.text);
    check('cost updated', res.json?.cost, 4200);

    res = await req('GET', '/api/fleet/logs?type=fuel');
    check('log type filter', res.json?.logs?.some((log) => log.id === logId), true);

    // ── Auth gate ────────────────────────────────────────────────────
    const stale = cookie;
    cookie = '';
    res = await req('GET', '/api/maintenance/assets');
    check('assets need auth', res.status, 401);
    res = await req('GET', '/api/fleet/vehicles');
    check('fleet needs auth', res.status, 401);
    cookie = stale;

    // ── Ownership gates + cascade deletes ────────────────────────────
    await prisma.user.update({ where: { id: user.id }, data: { role: 'user' } });
    res = await req('DELETE', `/api/fleet/vehicles?id=${vehicleId}`);
    check('plain user cannot delete vehicle', res.status, 403, res.text);
    await prisma.user.update({ where: { id: user.id }, data: { role: 'owner' } });

    res = await req('DELETE', `/api/maintenance/tasks?id=${taskId}`);
    check('delete task', res.status, 200, res.text);
    res = await req('GET', `/api/maintenance/tasks?id=${taskId}`);
    check('deleted task is gone', res.status, 404);

    res = await req('DELETE', `/api/maintenance/assets?id=${assetId}`);
    check('delete asset', res.status, 200, res.text);

    res = await req('DELETE', `/api/fleet/vehicles?id=${vehicleId}`);
    check('delete vehicle', res.status, 200, res.text);
    res = await req('GET', `/api/fleet/logs?id=${logId}`);
    check('vehicle logs cascade deleted', res.status, 404);
  } finally {
    await prisma.maintenanceTask.deleteMany({ where: { companyId: company.id, title: { startsWith: 'QA ' } } });
    await prisma.asset.deleteMany({ where: { companyId: company.id, name: { startsWith: 'QA ' } } });
    await prisma.vehicleLog.deleteMany({ where: { companyId: company.id, vendor: 'QA Pump' } });
    await prisma.vehicle.deleteMany({ where: { companyId: company.id, name: { startsWith: 'QA ' } } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  }

  const failed = results.filter((entry) => !entry.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) process.exit(1);
}

main().catch(async (error) => {
  console.error('E2E crashed:', error.message);
  await prisma.$disconnect();
  process.exit(1);
});
