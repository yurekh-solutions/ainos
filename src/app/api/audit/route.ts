import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/permissions';

const ENTITIES = ['rental', 'approval', 'shift', 'survey', 'event', 'registration'];

export async function GET(req: NextRequest) {
  const ctx = await requireSession(req);
  if (ctx.error) return ctx.error;

  const { searchParams } = new URL(req.url);
  const entity = searchParams.get('entity') || '';
  const entityId = searchParams.get('entityId') || '';

  if (!ENTITIES.includes(entity)) {
    return NextResponse.json({ error: 'Unknown entity' }, { status: 400 });
  }
  if (!entityId) {
    return NextResponse.json({ error: 'entityId is required' }, { status: 400 });
  }

  try {
    const entries = await prisma.auditLog.findMany({
      where: { companyId: ctx.companyId, entity, entityId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Audit GET failed', error);
    return NextResponse.json({ error: 'Could not load history' }, { status: 500 });
  }
}
