import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { authenticateEwb } from '@/lib/finance/ewaybillApi';

// Government-portal API credentials, per tenant, per GSTIN.
// These are the TAXPAYER'S OWN credentials from their free government portal
// registration (EWB portal → Registration → API) — AINOS never holds a GSP
// license. Secrets are never returned to the client; rows are masked.

const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[A-Z0-9]$/i;

const maskRow = (r: {
  id: string; portal: string; gstin: string; username: string; clientId: string | null;
  verified: boolean; lastTestedAt: Date | null; lastTestStatus: string | null; lastTestMessage: string | null;
}) => ({
  id: r.id, portal: r.portal, gstin: r.gstin, username: r.username, clientId: r.clientId,
  verified: r.verified, lastTestedAt: r.lastTestedAt, lastTestStatus: r.lastTestStatus,
  lastTestMessage: r.lastTestMessage, password: r.username ? '••••••' : '', clientSecret: r.clientId ? '••••••' : '',
});

async function resolveCompany(req: NextRequest) {
  const session = await getServerSession(req);
  if (!session?.user?.email) return { error: 'Unauthorized', status: 401 as const };
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user?.companyId) return { error: 'Company not found', status: 404 as const };
  return { companyId: user.companyId };
}

export async function GET(req: NextRequest) {
  const who = await resolveCompany(req);
  if ('error' in who) return NextResponse.json({ error: who.error }, { status: who.status });
  const rows = await prisma.govPortalCredential.findMany({
    where: { companyId: who.companyId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ credentials: rows.map(maskRow) });
}

export async function POST(req: NextRequest) {
  const who = await resolveCompany(req);
  if ('error' in who) return NextResponse.json({ error: who.error }, { status: who.status });

  const body = await req.json().catch(() => ({}));
  const portal = body.portal === 'IRP' ? 'IRP' : 'EWB';
  const gstin = String(body.gstin || '').trim().toUpperCase();
  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  const clientId = String(body.clientId || '').trim();
  const clientSecret = String(body.clientSecret || '');
  const test = body.action === 'test';

  if (!GSTIN_RE.test(gstin)) return NextResponse.json({ error: 'Enter a valid 15-character GSTIN' }, { status: 400 });
  if (!username || !password) return NextResponse.json({ error: 'Portal username and password are required' }, { status: 400 });
  if (portal === 'EWB' && (!clientId || !clientSecret)) {
    return NextResponse.json({ error: 'client-id and client-secret from the portal API registration are required' }, { status: 400 });
  }

  const existing = await prisma.govPortalCredential.findUnique({
    where: { companyId_portal_gstin: { companyId: who.companyId, portal, gstin } },
  });

  const row = await prisma.govPortalCredential.upsert({
    where: { companyId_portal_gstin: { companyId: who.companyId, portal, gstin } },
    create: { companyId: who.companyId, portal, gstin, username, password, clientId, clientSecret },
    update: { username, password: password || existing?.password || '', clientId, clientSecret: clientSecret || existing?.clientSecret || '' },
  });

  let testResult: { ok: boolean; message: string } | null = null;
  if (test) {
    try {
      await authenticateEwb({ gstin, username: row.username, password: row.password, clientId: row.clientId || '', clientSecret: row.clientSecret || '' });
      testResult = { ok: true, message: 'Portal accepted the credentials — ready to generate' };
      await prisma.govPortalCredential.update({
        where: { id: row.id },
        data: { verified: true, lastTestedAt: new Date(), lastTestStatus: 'ok', lastTestMessage: testResult.message },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Portal test failed';
      testResult = { ok: false, message };
      await prisma.govPortalCredential.update({
        where: { id: row.id },
        data: { verified: false, lastTestedAt: new Date(), lastTestStatus: 'failed', lastTestMessage: message },
      });
    }
  }

  const fresh = await prisma.govPortalCredential.findUnique({ where: { id: row.id } });
  return NextResponse.json({ credential: fresh ? maskRow(fresh) : null, testResult });
}

export async function DELETE(req: NextRequest) {
  const who = await resolveCompany(req);
  if ('error' in who) return NextResponse.json({ error: who.error }, { status: who.status });
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  const row = await prisma.govPortalCredential.findUnique({ where: { id } });
  if (!row || row.companyId !== who.companyId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.govPortalCredential.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
