import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const STATUSES = ['planned', 'in_progress', 'done', 'skipped'] as const;
const TYPES = ['preventive', 'corrective', 'inspection'] as const;

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
      const task = await prisma.maintenanceTask.findFirst({
        where: { id: singleId, companyId: context.companyId },
        include: { asset: { select: { id: true, name: true, code: true } } },
      });
      if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      return NextResponse.json({ task });
    }

    const status = searchParams.get('status');
    const assetId = searchParams.get('assetId');
    const search = (searchParams.get('q') || '').trim();

    const where: Record<string, unknown> = { companyId: context.companyId };
    if (status && status !== 'all') where.status = status;
    if (assetId) where.assetId = assetId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { technician: { contains: search, mode: 'insensitive' } },
      ];
    }

    const tasks = await prisma.maintenanceTask.findMany({
      where,
      orderBy: [{ status: 'asc' }, { dueAt: 'asc' }, { createdAt: 'desc' }],
      include: { asset: { select: { id: true, name: true, code: true } } },
    });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const open = tasks.filter((task) => task.status === 'planned' || task.status === 'in_progress');
    const overdue = open.filter((task) => task.dueAt && task.dueAt < now);

    return NextResponse.json({
      tasks,
      summary: {
        planned: tasks.filter((task) => task.status === 'planned').length,
        inProgress: tasks.filter((task) => task.status === 'in_progress').length,
        overdue: overdue.length,
        doneThisMonth: tasks.filter((task) => task.status === 'done' && task.completedAt && task.completedAt >= monthStart).length,
        costThisMonth: tasks
          .filter((task) => task.status === 'done' && task.completedAt && task.completedAt >= monthStart)
          .reduce((sum, task) => sum + (task.cost || 0), 0),
      },
      canManage: context.canManage,
    });
  } catch (error) {
    console.error('Error fetching maintenance tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const context = await getContext(req);
  if (context instanceof NextResponse) return context;

  try {
    const body = await req.json();
    const title = String(body.title || '').trim();
    const assetId = String(body.assetId || '');
    if (!title) return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
    if (!assetId) return NextResponse.json({ error: 'Pick an asset for this task' }, { status: 400 });

    const asset = await prisma.asset.findFirst({ where: { id: assetId, companyId: context.companyId } });
    if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

    const status = STATUSES.includes(body.status) ? body.status : 'planned';

    const task = await prisma.maintenanceTask.create({
      data: {
        assetId,
        title,
        type: TYPES.includes(body.type) ? body.type : 'preventive',
        status,
        dueAt: optionalDate(body.dueAt),
        completedAt: status === 'done' ? new Date() : null,
        technician: body.technician ? String(body.technician).trim() : null,
        cost: Number(body.cost) || 0,
        notes: body.notes ? String(body.notes).trim() : null,
        companyId: context.companyId,
      },
      include: { asset: { select: { id: true, name: true, code: true } } },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating maintenance task:', error);
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

    const existing = await prisma.maintenanceTask.findUnique({ where: { id } });
    if (!existing || existing.companyId !== context.companyId) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (body.title !== undefined) {
      const title = String(body.title).trim();
      if (!title) return NextResponse.json({ error: 'Task title cannot be empty' }, { status: 400 });
      data.title = title;
    }
    if (body.assetId !== undefined) {
      const asset = await prisma.asset.findFirst({
        where: { id: String(body.assetId), companyId: context.companyId },
      });
      if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
      data.assetId = asset.id;
    }
    if (body.type !== undefined) data.type = TYPES.includes(body.type) ? body.type : 'preventive';
    if (body.technician !== undefined) {
      data.technician = body.technician ? String(body.technician).trim() : null;
    }
    if (body.notes !== undefined) data.notes = body.notes ? String(body.notes).trim() : null;
    if (body.cost !== undefined) data.cost = Number(body.cost) || 0;
    if (body.dueAt !== undefined) data.dueAt = optionalDate(body.dueAt);

    if (body.status !== undefined) {
      const status = STATUSES.includes(body.status) ? body.status : existing.status;
      data.status = status;
      if (status === 'done' && existing.status !== 'done') {
        data.completedAt = new Date();
      } else if (status !== 'done') {
        data.completedAt = null;
      }
    }

    const task = await prisma.maintenanceTask.update({
      where: { id },
      data,
      include: { asset: { select: { id: true, name: true, code: true } } },
    });
    return NextResponse.json(task);
  } catch (error) {
    console.error('Error updating maintenance task:', error);
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

    const existing = await prisma.maintenanceTask.findUnique({ where: { id } });
    if (!existing || existing.companyId !== context.companyId) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    await prisma.maintenanceTask.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting maintenance task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
