import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function optionalDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function probabilityPercent(value: unknown): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return 0;
  return Math.min(100, Math.max(0, Math.round(parsed)));
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const stage = searchParams.get('stage');

    const where: Record<string, unknown> = {};
    // Use email-based scoping for deals (matches original pattern)
    where.OR = [
      { ownerId: session.user.id || session.user.email },
      { companyId: null }
    ];

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (user?.companyId) {
      where.companyId = user.companyId;
    }

    if (stage) where.stage = stage;

    const deals = await prisma.deal.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    const stats = {
      total: deals.length,
      byStage: deals.reduce((acc: Record<string, number>, d: { stage: string }) => { acc[d.stage] = (acc[d.stage] || 0) + 1; return acc; }, {}),
      totalValue: deals.reduce((sum: number, d: { value?: number | null }) => sum + (d.value || 0), 0),
      winRate: deals.length ? Math.round((deals.filter((d: { stage: string }) => d.stage === 'won').length / deals.length) * 100) : 0,
    };

    return NextResponse.json({ deals, stats });
  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });

    const deal = await prisma.deal.create({
      data: {
        title: body.title || 'Untitled Deal',
        value: body.value !== undefined && body.value !== null && body.value !== '' ? Number(body.value) : null,
        currency: body.currency || 'INR',
        stage: body.stage || 'new',
        probability: body.probability !== undefined && body.probability !== '' ? Number(body.probability) : 0,
        expectedClose: (body.expectedClose || body.closeDate) ? new Date(body.expectedClose || body.closeDate) : null,
        source: body.source || null,
        notes: [body.notes || null, body.contact ? `Contact: ${body.contact}` : null].filter(Boolean).join(' \u00b7 ') || null,
        companyId: user?.companyId || null,
        ownerId: session.user.id || session.user.email
      }
    });
    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    console.error('Error creating deal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id, ...rest } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const actor = session.user.id || session.user.email;
    const existing = await prisma.deal.findUnique({ where: { id: String(id) } });
    if (!existing) return NextResponse.json({ error: 'Deal not found' }, { status: 404 });

    // Deals created before company scoping have no companyId - fall back to the owner.
    const sameCompany = existing.companyId === user.companyId;
    const legacyOwner = !existing.companyId && existing.ownerId === actor;
    if (!sameCompany && !legacyOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const data: Record<string, unknown> = {};

    // `name` is accepted as an alias for the deal title column.
    const nextTitle = rest.title ?? rest.name;
    if (nextTitle !== undefined) {
      const title = String(nextTitle || '').trim();
      if (!title) return NextResponse.json({ error: 'Deal title cannot be empty' }, { status: 400 });
      data.title = title;
    }
    if (rest.value !== undefined) data.value = optionalNumber(rest.value);
    if (rest.currency !== undefined) {
      const currency = String(rest.currency || '').trim().toUpperCase();
      if (currency) data.currency = currency;
    }

    // `status` is accepted as an alias for the pipeline stage.
    const nextStage = rest.stage ?? rest.status;
    if (nextStage !== undefined) {
      const stage = String(nextStage || '').trim();
      if (stage) data.stage = stage;
    }

    if (rest.probability !== undefined) data.probability = probabilityPercent(rest.probability);
    if (rest.expectedClose !== undefined || rest.expectedCloseDate !== undefined || rest.closeDate !== undefined) {
      data.expectedClose = optionalDate(rest.expectedClose ?? rest.expectedCloseDate ?? rest.closeDate);
    }
    if (rest.source !== undefined) data.source = rest.source ? String(rest.source).trim() : null;
    if (rest.notes !== undefined) data.notes = rest.notes ? String(rest.notes).trim() : null;

    // Backfill company scoping so later requests are guarded by companyId alone.
    if (!existing.companyId) data.companyId = user.companyId;

    const deal = await prisma.deal.update({ where: { id: existing.id }, data });
    return NextResponse.json(deal);
  } catch (error) {
    console.error('Error updating deal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');
    if (!id) {
      try {
        const body = await req.json();
        id = body?.id ? String(body.id) : null;
      } catch {
        // DELETE without a body is fine - the id can come from the query string.
      }
    }
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const actor = session.user.id || session.user.email;
    const existing = await prisma.deal.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Deal not found' }, { status: 404 });

    const sameCompany = existing.companyId === user.companyId;
    const legacyOwner = !existing.companyId && existing.ownerId === actor;
    if (!sameCompany && !legacyOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.deal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting deal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
