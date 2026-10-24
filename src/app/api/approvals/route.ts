import { NextResponse, type NextRequest } from 'next/server';
import { Prisma, type ApprovalRequest } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/permissions';
import { diffFields, recordAudit } from '@/lib/audit';
import { money, num } from '@/lib/money';

const CATEGORIES = ['purchase', 'expense', 'leave', 'budget', 'other'];
const STATUSES = ['pending', 'approved', 'refused', 'cancelled'];
const DECISIONS = ['approved', 'refused'];

const AUDITED_FIELDS = [
  'title',
  'category',
  'amount',
  'requesterName',
  'approverName',
  'description',
  'status',
  'decidedAt',
  'decisionNote',
];

function present(request: ApprovalRequest) {
  return { ...request, amount: money(request.amount) };
}

export async function GET(req: NextRequest) {
  const ctx = await requireSession(req);
  if (ctx.error) return ctx.error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const search = (searchParams.get('q') || '').trim();

  try {
    if (id) {
      const request = await prisma.approvalRequest.findFirst({ where: { id, companyId: ctx.companyId } });
      if (!request) return NextResponse.json({ error: 'Approval request not found' }, { status: 404 });
      return NextResponse.json({ request: present(request), canManage: ctx.canManage, canApprove: ctx.permissions.canApprove });
    }

    const where: Prisma.ApprovalRequestWhereInput = { companyId: ctx.companyId };
    if (status && status !== 'all') where.status = status;
    if (category && category !== 'all') where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { requesterName: { contains: search, mode: 'insensitive' } },
        { approverName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const requests = await prisma.approvalRequest.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 });

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [pending, approvedMonth, refused, pendingAmount] = await Promise.all([
      prisma.approvalRequest.count({ where: { companyId: ctx.companyId, status: 'pending' } }),
      prisma.approvalRequest.count({ where: { companyId: ctx.companyId, status: 'approved', decidedAt: { gte: monthStart } } }),
      prisma.approvalRequest.count({ where: { companyId: ctx.companyId, status: 'refused' } }),
      prisma.approvalRequest.aggregate({ where: { companyId: ctx.companyId, status: 'pending' }, _sum: { amount: true } }),
    ]);

    return NextResponse.json({
      requests: requests.map(present),
      summary: {
        pending,
        approvedMonth,
        refused,
        pendingAmount: money(pendingAmount._sum.amount),
      },
      canManage: ctx.canManage,
      canApprove: ctx.permissions.canApprove,
      currentUserId: ctx.user.id,
    });
  } catch (error) {
    console.error('Approvals GET failed', error);
    return NextResponse.json({ error: 'Could not load approval requests' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ctx = await requireSession(req);
  if (ctx.error) return ctx.error;

  try {
    const body = await req.json();
    const title = String(body.title || '').trim();
    const requesterName = String(body.requesterName || '').trim();
    if (!title) return NextResponse.json({ error: 'A title is required' }, { status: 400 });
    if (!requesterName) return NextResponse.json({ error: 'Requester name is required' }, { status: 400 });

    const category = CATEGORIES.includes(body.category) ? body.category : 'other';
    const status = STATUSES.includes(body.status) ? body.status : 'pending';

    if (DECISIONS.includes(status) && !ctx.permissions.canApprove) {
      return NextResponse.json({ error: 'Only a manager, owner or admin can record a decision' }, { status: 403 });
    }

    const request = await prisma.approvalRequest.create({
      data: {
        title,
        category,
        amount: num(body.amount),
        requesterName,
        approverName: body.approverName ? String(body.approverName).trim() : null,
        description: body.description ? String(body.description) : null,
        status,
        decidedAt: status === 'pending' ? null : new Date(),
        decisionNote: body.decisionNote ? String(body.decisionNote) : null,
        createdById: ctx.user.id,
        decidedById: status === 'pending' ? null : ctx.user.id,
        companyId: ctx.companyId,
      },
    });

    await recordAudit({
      companyId: ctx.companyId,
      entity: 'approval',
      entityId: request.id,
      action: 'created',
      actor: ctx.user,
      summary: `${title} · ${money(request.amount)} · ${status}`,
    });

    return NextResponse.json({ request: present(request) }, { status: 201 });
  } catch (error) {
    console.error('Approvals POST failed', error);
    return NextResponse.json({ error: 'Could not create this approval request' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const ctx = await requireSession(req);
  if (ctx.error) return ctx.error;

  try {
    const body = await req.json();
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'Approval request id is required' }, { status: 400 });

    const existing = await prisma.approvalRequest.findFirst({ where: { id, companyId: ctx.companyId } });
    if (!existing) return NextResponse.json({ error: 'Approval request not found' }, { status: 404 });

    const data: Prisma.ApprovalRequestUpdateInput = {};
    if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim();
    if (typeof body.requesterName === 'string' && body.requesterName.trim()) data.requesterName = body.requesterName.trim();
    if (body.approverName !== undefined) data.approverName = body.approverName ? String(body.approverName).trim() : null;
    if (body.description !== undefined) data.description = body.description ? String(body.description) : null;
    if (body.decisionNote !== undefined) data.decisionNote = body.decisionNote ? String(body.decisionNote) : null;
    if (body.amount !== undefined) data.amount = num(body.amount);

    if (body.category !== undefined) {
      if (!CATEGORIES.includes(body.category)) return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      data.category = body.category;
    }

    if (body.status !== undefined) {
      if (!STATUSES.includes(body.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      if (DECISIONS.includes(body.status) && !ctx.permissions.canApprove) {
        return NextResponse.json({ error: 'Only a manager, owner or admin can record a decision' }, { status: 403 });
      }
      // Separation of duties: nobody signs off their own request.
      if (DECISIONS.includes(body.status) && existing.createdById === ctx.user.id) {
        return NextResponse.json({ error: 'You cannot approve or refuse your own request' }, { status: 403 });
      }
      data.status = body.status;
      data.decidedAt = body.status === 'pending' ? null : existing.decidedAt || new Date();
      data.decidedById = body.status === 'pending' ? null : ctx.user.id;
    }

    const request = await prisma.approvalRequest.update({ where: { id }, data });

    const decided = request.status !== existing.status;
    await recordAudit({
      companyId: ctx.companyId,
      entity: 'approval',
      entityId: request.id,
      action: decided ? request.status : 'updated',
      actor: ctx.user,
      summary: decided
        ? `${request.title}: ${existing.status} → ${request.status}`
        : `${request.title} updated`,
      changes: diffFields(
        existing as unknown as Record<string, unknown>,
        request as unknown as Record<string, unknown>,
        AUDITED_FIELDS,
      ),
    });

    return NextResponse.json({ request: present(request) });
  } catch (error) {
    console.error('Approvals PUT failed', error);
    return NextResponse.json({ error: 'Could not update this approval request' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const ctx = await requireSession(req);
  if (ctx.error) return ctx.error;
  if (!ctx.permissions.canDelete) return NextResponse.json({ error: 'Only an owner or admin can delete approval requests' }, { status: 403 });

  try {
    const id = new URL(req.url).searchParams.get('id') || '';
    if (!id) return NextResponse.json({ error: 'Approval request id is required' }, { status: 400 });

    const existing = await prisma.approvalRequest.findFirst({ where: { id, companyId: ctx.companyId } });
    if (!existing) return NextResponse.json({ error: 'Approval request not found' }, { status: 404 });

    await recordAudit({
      companyId: ctx.companyId,
      entity: 'approval',
      entityId: existing.id,
      action: 'deleted',
      actor: ctx.user,
      summary: `${existing.title} deleted`,
      changes: diffFields(existing as unknown as Record<string, unknown>, {}, AUDITED_FIELDS),
    });

    await prisma.approvalRequest.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Approvals DELETE failed', error);
    return NextResponse.json({ error: 'Could not delete this approval request' }, { status: 500 });
  }
}
