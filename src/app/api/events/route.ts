import { NextResponse, type NextRequest } from 'next/server';
import { Prisma, type Event, type EventRegistration } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/permissions';
import { diffFields, recordAudit } from '@/lib/audit';
import { money, num } from '@/lib/money';

const STATUSES = ['draft', 'published', 'closed', 'cancelled'];
const CATEGORIES = ['conference', 'workshop', 'webinar', 'training', 'meetup', 'other'];

const AUDITED_FIELDS = [
  'title',
  'category',
  'description',
  'startAt',
  'endAt',
  'location',
  'capacity',
  'ticketPrice',
  'status',
];

function cleanDate(value: unknown): Date | null {
  if (!value || typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function presentEvent(event: Event) {
  return { ...event, ticketPrice: money(event.ticketPrice) };
}

function presentRegistration(row: EventRegistration) {
  return { ...row, amount: money(row.amount) };
}

export async function GET(req: NextRequest) {
  const ctx = await requireSession(req);
  if (ctx.error) return ctx.error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const status = searchParams.get('status');
  const search = (searchParams.get('q') || '').trim();

  try {
    if (id) {
      const event = await prisma.event.findFirst({
        where: { id, companyId: ctx.companyId },
        include: { registrations: { orderBy: { registeredAt: 'desc' } } },
      });
      if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

      const confirmed = event.registrations.filter((row) => row.status === 'confirmed');
      const seatsSold = confirmed.reduce((sum, row) => sum + row.seats, 0);
      const revenue = confirmed.reduce((sum, row) => sum + money(row.amount), 0);

      return NextResponse.json({
        event: { ...presentEvent(event), registrations: event.registrations.map(presentRegistration) },
        stats: {
          seatsSold,
          revenue: money(revenue),
          capacityLeft: event.capacity > 0 ? Math.max(0, event.capacity - seatsSold) : null,
        },
        canManage: ctx.canManage,
      });
    }

    const where: Prisma.EventWhereInput = { companyId: ctx.companyId };
    if (status && status !== 'all') where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const events = await prisma.event.findMany({ where, orderBy: { startAt: 'desc' }, take: 200 });

    const ids = events.map((event) => event.id);
    const seatRows = ids.length
      ? await prisma.eventRegistration.groupBy({
          by: ['eventId'],
          where: { eventId: { in: ids }, status: 'confirmed' },
          _sum: { seats: true, amount: true },
        })
      : [];
    const seatMap = new Map(seatRows.map((row) => [row.eventId, row]));

    const rows = events.map((event) => {
      const seats = seatMap.get(event.id);
      return {
        ...presentEvent(event),
        seatsSold: seats?._sum.seats || 0,
        revenue: money(seats?._sum.amount),
      };
    });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [upcoming, published, seatsSold, revenue] = await Promise.all([
      prisma.event.count({ where: { companyId: ctx.companyId, startAt: { gte: now }, status: { in: ['published', 'draft'] } } }),
      prisma.event.count({ where: { companyId: ctx.companyId, status: 'published' } }),
      prisma.eventRegistration.aggregate({
        where: { status: 'confirmed', event: { companyId: ctx.companyId } },
        _sum: { seats: true },
      }),
      prisma.eventRegistration.aggregate({
        where: { status: 'confirmed', event: { companyId: ctx.companyId }, registeredAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
    ]);

    return NextResponse.json({
      events: rows,
      summary: {
        upcoming,
        published,
        seatsSold: seatsSold._sum.seats || 0,
        revenueMonth: money(revenue._sum.amount),
      },
      canManage: ctx.canManage,
    });
  } catch (error) {
    console.error('Events GET failed', error);
    return NextResponse.json({ error: 'Could not load events' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ctx = await requireSession(req);
  if (ctx.error) return ctx.error;

  try {
    const body = await req.json();
    const title = String(body.title || '').trim();
    const startAt = cleanDate(body.startAt);
    const endAt = cleanDate(body.endAt);

    if (!title) return NextResponse.json({ error: 'Event title is required' }, { status: 400 });
    if (!startAt) return NextResponse.json({ error: 'Event start is required' }, { status: 400 });
    if (endAt && endAt.getTime() <= startAt.getTime()) {
      return NextResponse.json({ error: 'Event end must be after the start' }, { status: 400 });
    }

    const event = await prisma.event.create({
      data: {
        title,
        category: CATEGORIES.includes(body.category) ? body.category : 'other',
        description: body.description ? String(body.description) : null,
        startAt,
        endAt,
        location: body.location ? String(body.location).trim() : null,
        capacity: Math.max(0, Math.round(num(body.capacity))),
        ticketPrice: Math.max(0, num(body.ticketPrice)),
        status: STATUSES.includes(body.status) ? body.status : 'draft',
        companyId: ctx.companyId,
      },
    });

    await recordAudit({
      companyId: ctx.companyId,
      entity: 'event',
      entityId: event.id,
      action: 'created',
      actor: ctx.user,
      summary: `${title} · ${money(event.ticketPrice)} / seat`,
    });

    return NextResponse.json({ event: presentEvent(event) }, { status: 201 });
  } catch (error) {
    console.error('Events POST failed', error);
    return NextResponse.json({ error: 'Could not create this event' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const ctx = await requireSession(req);
  if (ctx.error) return ctx.error;

  try {
    const body = await req.json();
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'Event id is required' }, { status: 400 });

    const existing = await prisma.event.findFirst({ where: { id, companyId: ctx.companyId } });
    if (!existing) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    const data: Prisma.EventUpdateInput = {};
    if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim();
    if (body.description !== undefined) data.description = body.description ? String(body.description) : null;
    if (body.location !== undefined) data.location = body.location ? String(body.location).trim() : null;
    if (body.capacity !== undefined) {
      const nextCapacity = Math.max(0, Math.round(num(body.capacity)));
      // Shrinking below what is already sold would orphan confirmed registrations.
      if (nextCapacity > 0) {
        const sold = await prisma.eventRegistration.aggregate({
          where: { eventId: id, status: 'confirmed' },
          _sum: { seats: true },
        });
        if ((sold._sum.seats || 0) > nextCapacity) {
          return NextResponse.json({
            error: `Capacity cannot be below the ${sold._sum.seats} seats already sold`,
          }, { status: 409 });
        }
      }
      data.capacity = nextCapacity;
    }
    if (body.ticketPrice !== undefined) data.ticketPrice = Math.max(0, num(body.ticketPrice));

    if (body.category !== undefined) {
      if (!CATEGORIES.includes(body.category)) return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      data.category = body.category;
    }
    if (body.status !== undefined) {
      if (!STATUSES.includes(body.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      data.status = body.status;
    }

    const startAt = cleanDate(body.startAt) || existing.startAt;
    const endAt = body.endAt === null ? null : cleanDate(body.endAt) || existing.endAt;
    if (endAt && endAt.getTime() <= startAt.getTime()) {
      return NextResponse.json({ error: 'Event end must be after the start' }, { status: 400 });
    }
    if (body.startAt !== undefined) data.startAt = startAt;
    if (body.endAt !== undefined) data.endAt = endAt;

    const event = await prisma.event.update({ where: { id }, data });

    const statusChanged = event.status !== existing.status;
    await recordAudit({
      companyId: ctx.companyId,
      entity: 'event',
      entityId: event.id,
      action: statusChanged ? 'status_changed' : 'updated',
      actor: ctx.user,
      summary: statusChanged
        ? `${event.title}: ${existing.status} → ${event.status}`
        : `${event.title} updated`,
      changes: diffFields(
        existing as unknown as Record<string, unknown>,
        event as unknown as Record<string, unknown>,
        AUDITED_FIELDS,
      ),
    });

    return NextResponse.json({ event: presentEvent(event) });
  } catch (error) {
    console.error('Events PUT failed', error);
    return NextResponse.json({ error: 'Could not update this event' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const ctx = await requireSession(req);
  if (ctx.error) return ctx.error;
  if (!ctx.permissions.canDelete) return NextResponse.json({ error: 'Only an owner or admin can delete events' }, { status: 403 });

  try {
    const id = new URL(req.url).searchParams.get('id') || '';
    if (!id) return NextResponse.json({ error: 'Event id is required' }, { status: 400 });

    const existing = await prisma.event.findFirst({ where: { id, companyId: ctx.companyId } });
    if (!existing) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    await recordAudit({
      companyId: ctx.companyId,
      entity: 'event',
      entityId: existing.id,
      action: 'deleted',
      actor: ctx.user,
      summary: `${existing.title} deleted`,
      changes: diffFields(existing as unknown as Record<string, unknown>, {}, AUDITED_FIELDS),
    });

    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Events DELETE failed', error);
    return NextResponse.json({ error: 'Could not delete this event' }, { status: 500 });
  }
}
