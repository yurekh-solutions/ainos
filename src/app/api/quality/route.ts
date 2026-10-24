import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const STATUSES = ['pending', 'passed', 'failed'] as const;
const TYPES = ['inspection', 'test', 'audit'] as const;

interface ChecklistItem {
  item: string;
  pass: boolean;
  notes?: string;
}

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

/** Keeps only well-formed checklist rows so a bad payload cannot corrupt the JSON column. */
function cleanChecklist(value: unknown): ChecklistItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      const entry = row as Record<string, unknown>;
      const item = String(entry?.item || '').trim();
      if (!item) return null;
      return {
        item,
        pass: Boolean(entry?.pass),
        ...(entry?.notes ? { notes: String(entry.notes).trim() } : {}),
      };
    })
    .filter((row): row is ChecklistItem => row !== null);
}

export async function GET(req: NextRequest) {
  const context = await getContext(req);
  if (context instanceof NextResponse) return context;

  try {
    const { searchParams } = new URL(req.url);

    const singleId = searchParams.get('id');
    if (singleId) {
      const check = await prisma.qualityCheck.findFirst({
        where: { id: singleId, companyId: context.companyId },
      });
      if (!check) return NextResponse.json({ error: 'Quality check not found' }, { status: 404 });
      return NextResponse.json({ check });
    }

    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = (searchParams.get('q') || '').trim();

    const where: Record<string, unknown> = { companyId: context.companyId };
    if (status && status !== 'all') where.status = status;
    if (type && type !== 'all') where.type = type;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { inspector: { contains: search, mode: 'insensitive' } },
      ];
    }

    const checks = await prisma.qualityCheck.findMany({
      where,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const inspected = checks.filter((check) => check.inspectedAt && check.inspectedAt >= monthStart);
    const passed = inspected.filter((check) => check.status === 'passed').length;
    const failed = inspected.filter((check) => check.status === 'failed').length;

    return NextResponse.json({
      checks,
      summary: {
        pending: checks.filter((check) => check.status === 'pending').length,
        passedMonth: passed,
        failedMonth: failed,
        passRate: passed + failed > 0 ? Math.round((passed / (passed + failed)) * 100) : null,
        total: checks.length,
      },
      canManage: context.canManage,
    });
  } catch (error) {
    console.error('Error fetching quality checks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const context = await getContext(req);
  if (context instanceof NextResponse) return context;

  try {
    const body = await req.json();
    const title = String(body.title || '').trim();
    if (!title) return NextResponse.json({ error: 'Give the check a title' }, { status: 400 });

    const status = STATUSES.includes(body.status) ? body.status : 'pending';

    const check = await prisma.qualityCheck.create({
      data: {
        title,
        type: TYPES.includes(body.type) ? body.type : 'inspection',
        status,
        inspector: body.inspector ? String(body.inspector).trim() : null,
        inspectedAt: status === 'pending' ? null : new Date(),
        notes: body.notes ? String(body.notes).trim() : null,
        checklist: cleanChecklist(body.checklist) as unknown as Prisma.InputJsonValue,
        companyId: context.companyId,
      },
    });

    return NextResponse.json(check, { status: 201 });
  } catch (error) {
    console.error('Error creating quality check:', error);
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

    const existing = await prisma.qualityCheck.findUnique({ where: { id } });
    if (!existing || existing.companyId !== context.companyId) {
      return NextResponse.json({ error: 'Quality check not found' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (body.title !== undefined) {
      const title = String(body.title).trim();
      if (!title) return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
      data.title = title;
    }
    if (body.type !== undefined) data.type = TYPES.includes(body.type) ? body.type : 'inspection';
    if (body.inspector !== undefined) {
      data.inspector = body.inspector ? String(body.inspector).trim() : null;
    }
    if (body.notes !== undefined) data.notes = body.notes ? String(body.notes).trim() : null;
    if (body.checklist !== undefined) data.checklist = cleanChecklist(body.checklist);

    if (body.status !== undefined) {
      const status = STATUSES.includes(body.status) ? body.status : existing.status;
      data.status = status;
      if (status === 'pending') {
        data.inspectedAt = null;
      } else if (existing.status === 'pending' || !existing.inspectedAt) {
        data.inspectedAt = new Date();
      }
    }

    const check = await prisma.qualityCheck.update({ where: { id }, data });
    return NextResponse.json(check);
  } catch (error) {
    console.error('Error updating quality check:', error);
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

    const existing = await prisma.qualityCheck.findUnique({ where: { id } });
    if (!existing || existing.companyId !== context.companyId) {
      return NextResponse.json({ error: 'Quality check not found' }, { status: 404 });
    }
    if (!context.canManage) {
      return NextResponse.json({ error: 'Only an owner or admin can delete a quality check' }, { status: 403 });
    }

    await prisma.qualityCheck.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting quality check:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
