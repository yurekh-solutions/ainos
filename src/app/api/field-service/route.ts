import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'] as const;
const PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;

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
    email: user.email,
    companyId: user.companyId,
    canDispatch:
      user.isAdmin || role === 'owner' || role === 'admin' || adminEmails.includes(user.email.toLowerCase()),
  };
}

function parseDate(value: string | null | undefined, endOfDay = false): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return date;
}

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Next FS-#### for this tenant, skipping numbers already taken. */
async function nextJobNumber(companyId: string): Promise<string> {
  const count = await prisma.serviceJob.count({ where: { companyId } });
  let candidate = count + 1;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const jobNumber = `FS-${String(candidate).padStart(4, '0')}`;
    const clash = await prisma.serviceJob.findFirst({ where: { companyId, jobNumber } });
    if (!clash) return jobNumber;
    candidate += 1;
  }
  return `FS-${Date.now().toString().slice(-6)}`;
}

export async function GET(req: NextRequest) {
  const context = await getContext(req);
  if (context instanceof NextResponse) return context;

  try {
    const { searchParams } = new URL(req.url);

    const singleId = searchParams.get('id');
    if (singleId) {
      const row = await prisma.serviceJob.findFirst({
        where: { id: singleId, companyId: context.companyId },
      });
      if (!row) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      return NextResponse.json({ job: row });
    }

    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const technician = searchParams.get('technician');
    const search = (searchParams.get('q') || '').trim();
    const from = parseDate(searchParams.get('from'));
    const to = parseDate(searchParams.get('to'), true);

    const where: Record<string, unknown> = { companyId: context.companyId };
    if (status && status !== 'all') where.status = status;
    if (priority && priority !== 'all') where.priority = priority;
    if (technician && technician !== 'all') where.technician = technician;
    if (from || to) {
      const range: Record<string, Date> = {};
      if (from) range.gte = from;
      if (to) range.lte = to;
      where.scheduledFor = range;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { technician: { contains: search, mode: 'insensitive' } },
        { jobNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [jobs, allOpen, completedRecent] = await Promise.all([
      prisma.serviceJob.findMany({
        where,
        orderBy: [{ scheduledFor: 'asc' }, { createdAt: 'desc' }],
        take: 500,
      }),
      prisma.serviceJob.findMany({
        where: { companyId: context.companyId, status: { in: ['scheduled', 'in_progress'] } },
        select: { id: true, status: true, priority: true, scheduledFor: true, technician: true },
      }),
      prisma.serviceJob.findMany({
        where: {
          companyId: context.companyId,
          status: 'completed',
          completedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
        select: { labourCost: true, partsCost: true },
      }),
    ]);

    const now = new Date();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const technicians = new Map<string, { open: number; completed: number }>();
    for (const job of jobs) {
      const key = job.technician?.trim() || 'Unassigned';
      const entry = technicians.get(key) || { open: 0, completed: 0 };
      if (job.status === 'completed') entry.completed += 1;
      else if (job.status !== 'cancelled') entry.open += 1;
      technicians.set(key, entry);
    }

    return NextResponse.json({
      jobs,
      summary: {
        dueToday: allOpen.filter(
          (job) => job.scheduledFor && job.scheduledFor >= startOfToday && job.scheduledFor <= endOfToday,
        ).length,
        inProgress: allOpen.filter((job) => job.status === 'in_progress').length,
        overdue: allOpen.filter((job) => job.scheduledFor && job.scheduledFor < startOfToday).length,
        openTotal: allOpen.length,
        urgent: allOpen.filter((job) => job.priority === 'urgent').length,
        completedValue: money(
          completedRecent.reduce((sum, job) => sum + job.labourCost + job.partsCost, 0),
        ),
        completedCount: completedRecent.length,
        byTechnician: Array.from(technicians.entries())
          .map(([name, value]) => ({ name, ...value }))
          .sort((a, b) => b.open - a.open)
          .slice(0, 6),
      },
      technicians: Array.from(
        new Set(jobs.map((job) => job.technician).filter((value): value is string => Boolean(value))),
      ).sort(),
      canDispatch: context.canDispatch,
    });
  } catch (error) {
    console.error('Error fetching service jobs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const context = await getContext(req);
  if (context instanceof NextResponse) return context;

  try {
    const body = await req.json();
    const title = String(body.title || '').trim();
    if (!title) return NextResponse.json({ error: 'Job title is required' }, { status: 400 });

    const scheduledFor = body.scheduledFor ? new Date(body.scheduledFor) : null;
    if (scheduledFor && Number.isNaN(scheduledFor.getTime())) {
      return NextResponse.json({ error: 'Invalid schedule date' }, { status: 400 });
    }

    const status = STATUSES.includes(body.status) ? body.status : 'scheduled';
    const priority = PRIORITIES.includes(body.priority) ? body.priority : 'normal';

    const job = await prisma.serviceJob.create({
      data: {
        jobNumber: await nextJobNumber(context.companyId),
        title,
        customerName: body.customerName ? String(body.customerName).trim() : null,
        contactPhone: body.contactPhone ? String(body.contactPhone).trim() : null,
        address: body.address ? String(body.address).trim() : null,
        technician: body.technician ? String(body.technician).trim() : null,
        priority,
        status,
        scheduledFor,
        completedAt: status === 'completed' ? new Date() : null,
        estimatedHours: body.estimatedHours ? Number(body.estimatedHours) : null,
        labourCost: Math.max(0, Number(body.labourCost) || 0),
        partsCost: Math.max(0, Number(body.partsCost) || 0),
        description: body.description ? String(body.description).trim() : null,
        notes: body.notes ? String(body.notes).trim() : null,
        companyId: context.companyId,
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('Error creating service job:', error);
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

    const existing = await prisma.serviceJob.findUnique({ where: { id } });
    if (!existing || existing.companyId !== context.companyId) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const wantsStatusChange = body.status !== undefined && body.status !== existing.status;
    if (wantsStatusChange && !context.canDispatch) {
      return NextResponse.json({ error: 'Only an owner or admin can change job status' }, { status: 403 });
    }

    const data: Record<string, unknown> = {};

    if (body.title !== undefined) {
      const title = String(body.title).trim();
      if (!title) return NextResponse.json({ error: 'Job title cannot be empty' }, { status: 400 });
      data.title = title;
    }
    if (body.customerName !== undefined) data.customerName = body.customerName ? String(body.customerName).trim() : null;
    if (body.contactPhone !== undefined) data.contactPhone = body.contactPhone ? String(body.contactPhone).trim() : null;
    if (body.address !== undefined) data.address = body.address ? String(body.address).trim() : null;
    if (body.technician !== undefined) data.technician = body.technician ? String(body.technician).trim() : null;
    if (body.description !== undefined) data.description = body.description ? String(body.description).trim() : null;
    if (body.notes !== undefined) data.notes = body.notes ? String(body.notes).trim() : null;
    if (body.priority !== undefined) {
      data.priority = PRIORITIES.includes(body.priority) ? body.priority : 'normal';
    }
    if (body.estimatedHours !== undefined) {
      data.estimatedHours = body.estimatedHours === '' ? null : Number(body.estimatedHours) || null;
    }
    if (body.labourCost !== undefined) data.labourCost = Math.max(0, Number(body.labourCost) || 0);
    if (body.partsCost !== undefined) data.partsCost = Math.max(0, Number(body.partsCost) || 0);
    if (body.scheduledFor !== undefined) {
      if (!body.scheduledFor) {
        data.scheduledFor = null;
      } else {
        const scheduledFor = new Date(body.scheduledFor);
        if (Number.isNaN(scheduledFor.getTime())) {
          return NextResponse.json({ error: 'Invalid schedule date' }, { status: 400 });
        }
        data.scheduledFor = scheduledFor;
      }
    }

    if (wantsStatusChange) {
      const status = String(body.status);
      if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
        return NextResponse.json({ error: 'Unknown status' }, { status: 400 });
      }
      data.status = status;
      data.completedAt = status === 'completed' ? new Date() : null;
    }

    const job = await prisma.serviceJob.update({ where: { id }, data });
    return NextResponse.json(job);
  } catch (error) {
    console.error('Error updating service job:', error);
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

    const existing = await prisma.serviceJob.findUnique({ where: { id } });
    if (!existing || existing.companyId !== context.companyId) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    if (!context.canDispatch && existing.status !== 'scheduled') {
      return NextResponse.json({ error: 'Only an owner or admin can delete a started job' }, { status: 403 });
    }

    await prisma.serviceJob.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting service job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
