// Rental + Approvals + Planning + Survey + Events E2E.
// Run: node --env-file=.env scripts/_odooAppsE2E.cjs
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const BASE = 'http://localhost:3000';
const stamp = Date.now();
const OWNER_EMAIL = `qa.apps.${stamp}@ainos-test.com`;
const PLAIN_EMAIL = `qa.apps.plain.${stamp}@ainos-test.com`;
const MANAGER_EMAIL = `qa.apps.manager.${stamp}@ainos-test.com`;
const PASSWORD = 'AppsQa12345';
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

const iso = (offsetHours) => new Date(Date.now() + offsetHours * 3600000).toISOString();

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
      name: 'QA Apps Owner',
      password,
      role: 'owner',
      companyId: company.id,
      emailVerifiedAt: new Date(),
    },
  });
  await prisma.user.create({
    data: {
      email: PLAIN_EMAIL,
      name: 'QA Apps Plain',
      password,
      role: 'user',
      companyId: company.id,
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.user.create({
    data: {
      email: MANAGER_EMAIL,
      name: 'QA Apps Manager',
      password,
      role: 'manager',
      companyId: company.id,
      emailVerifiedAt: new Date(),
    },
  });

  cookie = await loginUser(OWNER_EMAIL);
  const session = await req('GET', '/api/auth/session');
  check('owner session established', session.json?.user?.email, OWNER_EMAIL);
  const plainCookie = await loginUser(PLAIN_EMAIL);
  const managerCookie = await loginUser(MANAGER_EMAIL);

  // ── Rental ───────────────────────────────────────────────────
  const rental = await req('POST', '/api/rental', {
    customerName: 'Ravi Kumar',
    customerPhone: '9876543210',
    itemName: 'JCB 3DX excavator',
    quantity: 2,
    period: 'day',
    unitPrice: 5000,
    startDate: iso(24),
    endDate: iso(24 + 48),
    deposit: 10000,
    lateFee: 500,
    status: 'confirmed',
  });
  check('rental POST', rental.status, 201, rental.text);
  const rentalId = rental.json?.order?.id || '';
  check('rental number format', /^RNT-\d{4}-\d{4}$/.test(rental.json?.order?.orderNumber || ''), true);
  check('rental periods computed', rental.json?.periods, 2);
  check('rental fee = qty x rate x periods', rental.json?.order?.rentalFee, 20000);
  check('rental total includes deposit and late fee', rental.json?.order?.total, 30500);
  check('rental starts confirmed', rental.json?.order?.status, 'confirmed');
  check('rental not overdue yet', rental.json?.order?.isOverdue, false);

  const rentalBad = await req('POST', '/api/rental', {
    customerName: 'Bad Range',
    itemName: 'Projector',
    startDate: iso(48),
    endDate: iso(24),
  });
  check('rental rejects end before start', rentalBad.status, 400);

  const rentalMissing = await req('POST', '/api/rental', { customerName: 'No item', startDate: iso(24), endDate: iso(48) });
  check('rental requires item', rentalMissing.status, 400);

  const rentalOut = await req('PUT', '/api/rental', { id: rentalId, status: 'out' });
  check('rental PUT out', rentalOut.json?.order?.status, 'out');
  check('rental returnedAt null while out', rentalOut.json?.order?.returnedAt, null);

  const rentalReturned = await req('PUT', '/api/rental', { id: rentalId, status: 'returned' });
  check('rental PUT returned', rentalReturned.json?.order?.status, 'returned');
  check('rental stamps returnedAt', Boolean(rentalReturned.json?.order?.returnedAt), true);

  const rentalInvalid = await req('PUT', '/api/rental', { id: rentalId, status: 'nonsense' });
  check('rental rejects invalid status', rentalInvalid.status, 400);

  const overdue = await req('POST', '/api/rental', {
    customerName: 'Late Returner',
    itemName: 'Concrete mixer',
    quantity: 1,
    unitPrice: 1000,
    startDate: iso(-72),
    endDate: iso(-24),
    status: 'out',
  });
  check('rental overdue POST', overdue.status, 201, overdue.text);
  const overdueId = overdue.json?.order?.id || '';
  check('rental flags overdue', overdue.json?.order?.isOverdue, true);

  const rentalList = await req('GET', '/api/rental?status=overdue');
  check('rental filter overdue finds row', rentalList.json?.orders?.some((row) => row.id === overdueId), true);
  check('rental summary overdue >= 1', (rentalList.json?.summary?.overdue || 0) >= 1, true);

  const rentalPlainDelete = await req('DELETE', `/api/rental?id=${rentalId}`, undefined, plainCookie);
  check('rental DELETE blocked for plain user', rentalPlainDelete.status, 403);

  const rentalDelete = await req('DELETE', `/api/rental?id=${overdueId}`);
  check('rental DELETE owner', rentalDelete.status, 200, rentalDelete.text);
  const rentalGone = await req('GET', `/api/rental?id=${overdueId}`);
  check('rental GET after delete', rentalGone.status, 404);

  // Exact money + audit trail on the same record.
  const decimalRental = await req('POST', '/api/rental', {
    customerName: 'Decimal Precision',
    itemName: 'Laser level',
    quantity: 3,
    period: 'day',
    unitPrice: 33.33,
    startDate: iso(24),
    endDate: iso(24 + 48),
    deposit: 0.07,
    lateFee: 0.03,
    status: 'confirmed',
  });
  check('rental decimal POST', decimalRental.status, 201, decimalRental.text);
  const decimalId = decimalRental.json?.order?.id || '';
  check('rental exact fee 3 x 33.33 x 2', decimalRental.json?.order?.rentalFee, 199.98);
  check('rental exact total with paise', decimalRental.json?.order?.total, 200.08);
  check('rental money serialised as number', typeof decimalRental.json?.order?.total, 'number');

  await req('PUT', '/api/rental', { id: decimalId, status: 'out' });
  const rentalAudit = await req('GET', `/api/audit?entity=rental&entityId=${decimalId}`);
  const rentalEntries = rentalAudit.json?.entries || [];
  check('rental history created', rentalEntries.some((row) => row.action === 'created'), true);
  check('rental history records status change', rentalEntries.some((row) => row.action === 'status_changed'), true);
  check('rental history names the actor', typeof (rentalEntries[0] || {}).actorEmail, 'string');
  const auditMember = await req('GET', `/api/audit?entity=rental&entityId=${decimalId}`, undefined, plainCookie);
  check('audit readable by company member', auditMember.status, 200);
  check('audit rejects unknown entity', (await req('GET', '/api/audit?entity=widget&entityId=x')).status, 400);
  check('audit requires entityId', (await req('GET', '/api/audit?entity=rental')).status, 400);
  check('audit requires auth', (await req('GET', `/api/audit?entity=rental&entityId=${decimalId}`, undefined, '')).status, 401);

  for (const page of ['/rental', '/rental/new', `/rental/${decimalId}/edit`]) {
    check(`rental page renders ${page}`, (await req('GET', page)).status, 200);
  }

  // ── Approvals ────────────────────────────────────────────────
  const approval = await req('POST', '/api/approvals', {
    title: 'New laptops for design team',
    category: 'purchase',
    amount: 240000,
    requesterName: 'Priya Nair',
    approverName: 'Finance head',
    description: 'Three MacBook Pros',
  });
  check('approval POST', approval.status, 201, approval.text);
  const approvalId = approval.json?.request?.id || '';
  check('approval defaults pending', approval.json?.request?.status, 'pending');
  check('approval decidedAt null while pending', approval.json?.request?.decidedAt, null);

  // Separation of duties: the requester cannot sign off, and a plain member has no decision right.
  const approvalSelf = await req('PUT', '/api/approvals', { id: approvalId, status: 'approved' });
  check('approval blocks self-approval', approvalSelf.status, 403, approvalSelf.text);
  const approvalMember = await req('PUT', '/api/approvals', { id: approvalId, status: 'approved' }, plainCookie);
  check('approval blocks member decision', approvalMember.status, 403, approvalMember.text);

  const approvalApprove = await req('PUT', '/api/approvals', { id: approvalId, status: 'approved', decisionNote: 'Approved in budget' }, managerCookie);
  check('approval PUT approved by manager', approvalApprove.json?.request?.status, 'approved');
  check('approval stamps decidedAt', Boolean(approvalApprove.json?.request?.decidedAt), true);
  check('approval records who decided', Boolean(approvalApprove.json?.request?.decidedById), true);

  const approvalHistory = await req('GET', `/api/audit?entity=approval&entityId=${approvalId}`);
  check('approval history records decision', (approvalHistory.json?.entries || []).some((row) => row.action === 'approved'), true);

  const approvalInvalid = await req('PUT', '/api/approvals', { id: approvalId, status: 'maybe' });
  check('approval rejects invalid status', approvalInvalid.status, 400);

  const approvalFilter = await req('GET', '/api/approvals?status=approved');
  check('approval filter approved finds row', approvalFilter.json?.requests?.some((row) => row.id === approvalId), true);
  check('approval summary has pendingAmount key', typeof approvalFilter.json?.summary?.pendingAmount, 'number');
  check('approval list tells owner they can decide', approvalFilter.json?.canApprove, true);
  const approvalFilterMember = await req('GET', '/api/approvals', undefined, plainCookie);
  check('approval list hides decisions from member', approvalFilterMember.json?.canApprove, false);

  for (const page of ['/approvals', '/approvals/new', `/approvals/${approvalId}/edit`]) {
    check(`approval page renders ${page}`, (await req('GET', page)).status, 200);
  }

  const approvalPlainDelete = await req('DELETE', `/api/approvals?id=${approvalId}`, undefined, plainCookie);
  check('approval DELETE blocked for plain user', approvalPlainDelete.status, 403);
  const approvalDelete = await req('DELETE', `/api/approvals?id=${approvalId}`);
  check('approval DELETE owner', approvalDelete.status, 200, approvalDelete.text);

  // ── Planning ─────────────────────────────────────────────────
  const dayStart = new Date();
  dayStart.setHours(9, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setHours(17, 0, 0, 0);

  const shift = await req('POST', '/api/planning', {
    employeeName: 'Imran Sheikh',
    role: 'Field technician',
    startAt: dayStart.toISOString(),
    endAt: dayEnd.toISOString(),
    location: 'Andheri service centre',
  });
  check('shift POST', shift.status, 201, shift.text);
  const shiftId = shift.json?.shift?.id || '';
  check('shift hours computed', shift.json?.shift?.hours, 8);
  check('shift defaults planned', shift.json?.shift?.status, 'planned');

  const shiftBad = await req('POST', '/api/planning', {
    employeeName: 'Bad Range',
    startAt: dayEnd.toISOString(),
    endAt: dayStart.toISOString(),
  });
  check('shift rejects end before start', shiftBad.status, 400);

  const shiftConfirm = await req('PUT', '/api/planning', { id: shiftId, status: 'confirmed' });
  check('shift PUT confirmed', shiftConfirm.json?.shift?.status, 'confirmed');

  const shiftClash = await req('POST', '/api/planning', {
    employeeName: 'Imran Sheikh',
    startAt: new Date(dayStart.getTime() + 3 * 3600000).toISOString(),
    endAt: new Date(dayStart.getTime() + 11 * 3600000).toISOString(),
  });
  check('shift blocks double booking', shiftClash.status, 409, shiftClash.text);

  const shiftOther = await req('POST', '/api/planning', {
    employeeName: 'Neha Kulkarni',
    startAt: dayStart.toISOString(),
    endAt: dayEnd.toISOString(),
  });
  check('shift allows same hours for another employee', shiftOther.status, 201, shiftOther.text);
  const shiftOtherId = shiftOther.json?.shift?.id || '';
  if (shiftOtherId) await req('DELETE', `/api/planning?id=${shiftOtherId}`);

  const shiftInvalid = await req('PUT', '/api/planning', { id: shiftId, status: 'sleeping' });
  check('shift rejects invalid status', shiftInvalid.status, 400);

  const shiftList = await req('GET', '/api/planning?status=confirmed');
  check('shift list finds row', shiftList.json?.shifts?.some((row) => row.id === shiftId), true);
  check('shift summary weekHours >= 8', (shiftList.json?.summary?.weekHours || 0) >= 8, true);

  for (const page of ['/planning', '/planning/new', `/planning/${shiftId}/edit`]) {
    check(`planning page renders ${page}`, (await req('GET', page)).status, 200);
  }

  const shiftPlainDelete = await req('DELETE', `/api/planning?id=${shiftId}`, undefined, plainCookie);
  check('shift DELETE blocked for plain user', shiftPlainDelete.status, 403);
  const shiftDelete = await req('DELETE', `/api/planning?id=${shiftId}`);
  check('shift DELETE owner', shiftDelete.status, 200, shiftDelete.text);

  // ── Surveys ──────────────────────────────────────────────────
  const survey = await req('POST', '/api/surveys', {
    title: `Post-service satisfaction ${stamp}`,
    description: 'Two minute feedback',
    audience: 'customers',
    questions: [
      { prompt: 'Rate the service', kind: 'rating', required: true },
      { prompt: 'What could be better?', kind: 'text', required: false },
      { prompt: 'Choose your region', kind: 'choice', required: true, options: ['North', 'South'] },
    ],
  });
  check('survey POST', survey.status, 201, survey.text);
  const surveyId = survey.json?.survey?.id || '';
  const questions = survey.json?.survey?.questions || [];
  check('survey stores questions', questions.length, 3);
  check('survey question positions ordered', questions.map((row) => row.position).join(','), '0,1,2');
  check('survey defaults draft', survey.json?.survey?.status, 'draft');

  const surveyBadChoice = await req('POST', '/api/surveys', {
    title: 'Bad choice',
    questions: [{ prompt: 'Pick one', kind: 'choice', required: true, options: ['Only'] }],
  });
  check('survey rejects single-option choice', surveyBadChoice.status, 400);

  const surveyNoQuestions = await req('POST', '/api/surveys', { title: 'Empty', questions: [] });
  check('survey requires questions', surveyNoQuestions.status, 400);

  const ratingQuestion = questions.find((row) => row.kind === 'rating') || {};
  const choiceQuestion = questions.find((row) => row.kind === 'choice') || {};

  const draftResponse = await req('POST', '/api/surveys/responses', {
    surveyId,
    answers: [{ questionId: ratingQuestion.id, value: '5' }],
  });
  check('survey draft rejects responses', draftResponse.status, 400);

  const surveyLive = await req('PUT', '/api/surveys', { id: surveyId, status: 'live' });
  check('survey PUT live', surveyLive.json?.survey?.status, 'live');
  check('survey PUT keeps questions', surveyLive.json?.survey?.questions?.length, 3);

  const missingAnswer = await req('POST', '/api/surveys/responses', {
    surveyId,
    answers: [{ questionId: choiceQuestion.id, value: 'North' }],
  });
  check('survey enforces required question', missingAnswer.status, 400);

  const badRating = await req('POST', '/api/surveys/responses', {
    surveyId,
    answers: [
      { questionId: ratingQuestion.id, value: '9' },
      { questionId: choiceQuestion.id, value: 'North' },
    ],
  });
  check('survey rejects rating above 5', badRating.status, 400);

  const response = await req('POST', '/api/surveys/responses', {
    surveyId,
    respondentName: 'Meera Sharma',
    answers: [
      { questionId: ratingQuestion.id, value: '5' },
      { questionId: choiceQuestion.id, value: 'South' },
    ],
  });
  check('survey response POST', response.status, 201, response.text);
  check('survey response score computed', response.json?.response?.score, 5);

  const surveyDetail = await req('GET', `/api/surveys?id=${surveyId}`);
  check('survey GET single', surveyDetail.status, 200, surveyDetail.text);
  check('survey stats responses', surveyDetail.json?.stats?.responses, 1);
  check('survey stats average', surveyDetail.json?.stats?.average, 5);

  const surveyList = await req('GET', '/api/surveys?status=live');
  const listed = (surveyList.json?.surveys || []).find((row) => row.id === surveyId) || {};
  check('survey list questionCount', listed.questionCount, 3);
  check('survey list responseCount', listed.responseCount, 1);
  check('survey list average', listed.average, 5);

  // Shareable public link: no session, no tenant identifiers leaked.
  const publicSurvey = await req('GET', `/api/public/surveys/${surveyId}`, undefined, '');
  check('public survey GET without session', publicSurvey.status, 200, publicSurvey.text);
  check('public survey returns title', publicSurvey.json?.survey?.title, `Post-service satisfaction ${stamp}`);
  check('public survey returns questions', publicSurvey.json?.survey?.questions?.length, 3);
  check('public survey hides companyId', publicSurvey.json?.survey?.companyId, undefined);

  const publicMissing = await req('POST', `/api/public/surveys/${surveyId}`, { answers: [{ questionId: choiceQuestion.id, value: 'North' }] }, '');
  check('public survey enforces required answers', publicMissing.status, 400, publicMissing.text);

  const publicBadChoice = await req('POST', `/api/public/surveys/${surveyId}`, {
    answers: [
      { questionId: ratingQuestion.id, value: '4' },
      { questionId: choiceQuestion.id, value: 'East' },
    ],
  }, '');
  check('public survey validates choice options', publicBadChoice.status, 400, publicBadChoice.text);

  const publicOk = await req('POST', `/api/public/surveys/${surveyId}`, {
    respondentName: 'Public Visitor',
    answers: [
      { questionId: ratingQuestion.id, value: '4' },
      { questionId: choiceQuestion.id, value: 'North' },
    ],
  }, '');
  check('public survey POST without session', publicOk.status, 201, publicOk.text);
  check('public survey scores response', publicOk.json?.score, 4);
  check('public survey 404 when unknown', (await req('GET', '/api/public/surveys/00000000-0000-0000-0000-000000000000', undefined, '')).status, 404);

  for (const page of ['/marketing/surveys', '/marketing/surveys/new', `/marketing/surveys/${surveyId}/edit`, `/marketing/surveys/${surveyId}/respond`, `/s/${surveyId}`]) {
    check(`survey page renders ${page}`, (await req('GET', page)).status, 200);
  }

  const surveyPlainDelete = await req('DELETE', `/api/surveys?id=${surveyId}`, undefined, plainCookie);
  check('survey DELETE blocked for plain user', surveyPlainDelete.status, 403);

  // ── Events ───────────────────────────────────────────────────
  const event = await req('POST', '/api/events', {
    title: `AINOS Partner Summit ${stamp}`,
    category: 'conference',
    startAt: iso(240),
    endAt: iso(246),
    location: 'Grand Hyatt, Mumbai',
    capacity: 3,
    ticketPrice: 500,
    status: 'draft',
  });
  check('event POST', event.status, 201, event.text);
  const eventId = event.json?.event?.id || '';
  check('event defaults draft', event.json?.event?.status, 'draft');

  const earlyRegistration = await req('POST', '/api/events/registrations', {
    eventId,
    attendeeName: 'Early Bird',
    seats: 1,
  });
  check('event draft rejects registration', earlyRegistration.status, 400);

  const eventPublished = await req('PUT', '/api/events', { id: eventId, status: 'published' });
  check('event PUT published', eventPublished.json?.event?.status, 'published');

  const registration = await req('POST', '/api/events/registrations', {
    eventId,
    attendeeName: 'Meera Sharma',
    attendeeEmail: 'meera@email.com',
    seats: 2,
  });
  check('event registration POST', registration.status, 201, registration.text);
  const registrationId = registration.json?.registration?.id || '';
  check('event seat amount = seats x price', registration.json?.registration?.amount, 1000);

  const overCapacity = await req('POST', '/api/events/registrations', {
    eventId,
    attendeeName: 'Too Many',
    seats: 2,
  });
  check('event enforces capacity', overCapacity.status, 400);

  const cancel = await req('PATCH', '/api/events/registrations', { id: registrationId, status: 'cancelled' });
  check('event registration PATCH cancelled', cancel.json?.registration?.status, 'cancelled');

  const reRegister = await req('POST', '/api/events/registrations', {
    eventId,
    attendeeName: 'Late Joiner',
    seats: 2,
  });
  check('event frees cancelled seats', reRegister.status, 201, reRegister.text);
  const reRegisterId = reRegister.json?.registration?.id || '';

  const eventDetail = await req('GET', `/api/events?id=${eventId}`);
  check('event GET single', eventDetail.status, 200, eventDetail.text);
  check('event stats seatsSold', eventDetail.json?.stats?.seatsSold, 2);
  check('event stats revenue', eventDetail.json?.stats?.revenue, 1000);
  check('event stats capacityLeft', eventDetail.json?.stats?.capacityLeft, 1);

  const eventList = await req('GET', '/api/events?status=published');
  const listedEvent = (eventList.json?.events || []).find((row) => row.id === eventId) || {};
  check('event list seatsSold', listedEvent.seatsSold, 2);
  check('event summary seatsSold >= 2', (eventList.json?.summary?.seatsSold || 0) >= 2, true);

  const eventInvalid = await req('PUT', '/api/events', { id: eventId, status: 'archived' });
  check('event rejects invalid status', eventInvalid.status, 400);

  // Public registration link: same capacity rules, no session required.
  const publicEvent = await req('GET', `/api/public/events/${eventId}`, undefined, '');
  check('public event GET without session', publicEvent.status, 200, publicEvent.text);
  check('public event reports seats left', publicEvent.json?.seatsLeft, 1);
  check('public event price is a number', typeof publicEvent.json?.event?.ticketPrice, 'number');

  const publicOverbook = await req('POST', `/api/public/events/${eventId}`, { attendeeName: 'Public Guest', seats: 2 }, '');
  check('public booking respects capacity', publicOverbook.status, 400, publicOverbook.text);

  const publicBooking = await req('POST', `/api/public/events/${eventId}`, { attendeeName: 'Public Guest', attendeeEmail: 'guest@email.com', seats: 1 }, '');
  check('public booking succeeds', publicBooking.status, 201, publicBooking.text);
  check('public booking amount = seats x price', publicBooking.json?.registration?.amount, 500);
  const publicBookingId = publicBooking.json?.registration?.id || '';

  const shrunk = await req('PUT', '/api/events', { id: eventId, capacity: 2 });
  check('event capacity cannot drop below sold seats', shrunk.status, 409, shrunk.text);
  const grown = await req('PUT', '/api/events', { id: eventId, capacity: 4 });
  check('event capacity can grow', grown.json?.event?.capacity, 4);
  check('event capacity guard leaves seats intact', (await req('GET', `/api/events?id=${eventId}`)).json?.stats?.seatsSold, 3);

  const eventAudit = await req('GET', `/api/audit?entity=event&entityId=${eventId}`);
  check('event history records updates', (eventAudit.json?.entries || []).some((row) => row.action === 'updated'), true);

  for (const page of ['/marketing/events', '/marketing/events/new', `/marketing/events/${eventId}/edit`, `/marketing/events/${eventId}/register`, `/e/${eventId}`]) {
    check(`event page renders ${page}`, (await req('GET', page)).status, 200);
  }

  const eventPlainDelete = await req('DELETE', `/api/events?id=${eventId}`, undefined, plainCookie);
  check('event DELETE blocked for plain user', eventPlainDelete.status, 403);
  const eventDelete = await req('DELETE', `/api/events?id=${eventId}`);
  check('event DELETE owner', eventDelete.status, 200, eventDelete.text);
  const eventGone = await req('GET', `/api/events?id=${eventId}`);
  check('event GET after delete', eventGone.status, 404);
  const registrationGone = await prisma.eventRegistration.findUnique({ where: { id: reRegisterId } });
  check('event delete cascades registrations', registrationGone, null);

  // ── Auth guards ──────────────────────────────────────────────
  check('rental requires auth', (await req('GET', '/api/rental', undefined, '')).status, 401);
  check('approvals requires auth', (await req('GET', '/api/approvals', undefined, '')).status, 401);
  check('planning requires auth', (await req('GET', '/api/planning', undefined, '')).status, 401);
  check('surveys requires auth', (await req('GET', '/api/surveys', undefined, '')).status, 401);
  check('events requires auth', (await req('GET', '/api/events', undefined, '')).status, 401);

  // ── Cleanup ──────────────────────────────────────────────────
  await prisma.rentalOrder.deleteMany({ where: { companyId: company.id, customerName: { in: ['Ravi Kumar', 'Late Returner', 'Decimal Precision'] } } });
  await prisma.auditLog.deleteMany({
    where: {
      companyId: company.id,
      entityId: { in: [rentalId, overdueId, decimalId, approvalId, surveyId, eventId, registrationId, reRegisterId, publicBookingId].filter(Boolean) },
    },
  });
  await prisma.surveyResponse.deleteMany({ where: { surveyId } });
  await prisma.survey.deleteMany({ where: { companyId: company.id, id: surveyId } });
  await prisma.event.deleteMany({ where: { companyId: company.id, id: eventId } });
  await prisma.user.deleteMany({ where: { email: { in: [OWNER_EMAIL, PLAIN_EMAIL, MANAGER_EMAIL] } } });

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
