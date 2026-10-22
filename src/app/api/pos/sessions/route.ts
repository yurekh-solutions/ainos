import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const sessions = await prisma.pOSSession.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(sessions);
  } catch (e) {
    console.error('GET /api/pos/sessions error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const body = await req.json();
    const posSession = await prisma.pOSSession.create({
      data: {
        name: body.name || `Session ${new Date().toLocaleDateString()}`,
        status: 'open',
        openedAt: new Date(),
        openedBy: session.user.email,
        openingCash: body.openingCash || 0,
        companyId: user.companyId,
      },
    });
    return NextResponse.json(posSession, { status: 201 });
  } catch (e) {
    console.error('POST /api/pos/sessions error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const existing = await prisma.pOSSession.findUnique({ where: { id } });
    if (!existing || existing.companyId !== user.companyId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const posSession = await prisma.pOSSession.update({
      where: { id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.closingCash !== undefined && { closingCash: body.closingCash }),
        ...(body.totalSales !== undefined && { totalSales: body.totalSales }),
        ...(body.totalOrders !== undefined && { totalOrders: body.totalOrders }),
        ...(body.closedAt && { closedAt: body.closedAt }),
        ...(body.closedBy && { closedBy: body.closedBy }),
        ...(body.notes && { notes: body.notes }),
      },
    });
    return NextResponse.json(posSession);
  } catch (e) {
    console.error('PUT /api/pos/sessions error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
