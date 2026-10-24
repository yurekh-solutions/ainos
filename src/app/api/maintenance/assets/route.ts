import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const STATUSES = ['active', 'under_maintenance', 'retired'] as const;

async function getContext(req: NextRequest) {
  const session = await getServerSession(req);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  const role = (user.role || '').toLowerCase();

  return {
    companyId: user.companyId,
    canManage: user.isAdmin || role === 'owner' || role === 'admin' || adminEmails.includes(user.email.toLowerCase()),
  };
}

function optionalDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(req: NextRequest) {
  const context = await getContext(req);
  if (context instanceof NextResponse) return context;

  try {
    const { searchParams } = new URL(req.url);

    const singleId = searchParams.get('id');
    if (singleId) {
      const asset = await prisma.asset.findFirst({
        where: { id: singleId, companyId: context.companyId },
        include: { tasks: { orderBy: [{ status: 'asc' }, { dueAt: 'asc' }] } },
      });
      if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
      return NextResponse.json({ asset });
    }

    const status = searchParams.get('status');
    const search = (searchParams.get('q') || '').trim();

    const where: Record<string, unknown> = { companyId: context.companyId };
    if (status && status !== 'all') where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const assets = await prisma.asset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        tasks: {
          where: { status: { in: ['planned', 'in_progress'] } },
          select: { id: true, dueAt: true, status: true },
        },
      },
    });

    const now = new Date();
    const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const rows = assets.map((asset) => {
      const dueDates = asset.tasks
        .map((task) => task.dueAt)
        .filter((value): value is Date => Boolean(value))
        .sort((a, b) => a.getTime() - b.getTime());
      return {
        id: asset.id,
        name: asset.name,
        code: asset.code,
        category: asset.category,
        location: asset.location,
        serialNumber: asset.serialNumber,
        assignedTo: asset.assignedTo,
        purchasedAt: asset.purchasedAt,
        warrantyUntil: asset.warrantyUntil,
        status: asset.status,
        notes: asset.notes,
        openTasks: asset.tasks.length,
        inProgress: asset.tasks.filter((task) => task.status === 'in_progress').length,
        nextDue: dueDates[0] || null,
      };
    });

    return NextResponse.json({
      assets: rows,
      summary: {
        total: rows.length,
        underMaintenance: rows.filter((asset) => asset.status === 'under_maintenance').length,
        dueThisWeek: rows.filter((asset) => asset.nextDue && asset.nextDue <= weekAhead).length,
        overdue: rows.filter((asset) => asset.nextDue && asset.nextDue < now).length,
      },
      canManage: context.canManage,
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const context = await getContext(req);
  if (context instanceof NextResponse) return context;

  try {
    const body = await req.json();
    const name = String(body.name || '').trim();
    if (!name) return NextResponse.json({ error: 'Asset name is required' }, { status: 400 });

    const asset = await prisma.asset.create({
      data: {
        name,
        code: body.code ? String(body.code).trim() : null,
        category: body.category ? String(body.category).trim() : null,
        location: body.location ? String(body.location).trim() : null,
        serialNumber: body.serialNumber ? String(body.serialNumber).trim() : null,
        assignedTo: body.assignedTo ? String(body.assignedTo).trim() : null,
        purchasedAt: optionalDate(body.purchasedAt),
        warrantyUntil: optionalDate(body.warrantyUntil),
        status: STATUSES.includes(body.status) ? body.status : 'active',
        notes: body.notes ? String(body.notes).trim() : null,
        companyId: context.companyId,
      },
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const context = await getContext(req);
  if (context instanceof NextResponse) return context;

  try {
    const body = await req.json();
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const existing = await prisma.asset.findUnique({ where: { id } });
    if (!existing || existing.companyId !== context.companyId) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }
    if (!context.canManage) {
      return NextResponse.json({ error: 'Only an owner or admin can edit assets' }, { status: 403 });
    }

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) return NextResponse.json({ error: 'Asset name cannot be empty' }, { status: 400 });
      data.name = name;
    }
    if (body.code !== undefined) data.code = body.code ? String(body.code).trim() : null;
    if (body.category !== undefined) data.category = body.category ? String(body.category).trim() : null;
    if (body.location !== undefined) data.location = body.location ? String(body.location).trim() : null;
    if (body.serialNumber !== undefined) {
      data.serialNumber = body.serialNumber ? String(body.serialNumber).trim() : null;
    }
    if (body.assignedTo !== undefined) data.assignedTo = body.assignedTo ? String(body.assignedTo).trim() : null;
    if (body.notes !== undefined) data.notes = body.notes ? String(body.notes).trim() : null;
    if (body.purchasedAt !== undefined) data.purchasedAt = optionalDate(body.purchasedAt);
    if (body.warrantyUntil !== undefined) data.warrantyUntil = optionalDate(body.warrantyUntil);
    if (body.status !== undefined) data.status = STATUSES.includes(body.status) ? body.status : 'active';

    const asset = await prisma.asset.update({ where: { id }, data });
    return NextResponse.json(asset);
  } catch (error) {
    console.error('Error updating asset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const context = await getContext(req);
  if (context instanceof NextResponse) return context;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const existing = await prisma.asset.findUnique({ where: { id } });
    if (!existing || existing.companyId !== context.companyId) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }
    if (!context.canManage) {
      return NextResponse.json({ error: 'Only an owner or admin can delete assets' }, { status: 403 });
    }

    await prisma.asset.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
