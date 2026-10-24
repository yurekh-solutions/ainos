import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rateLimit';
import { recordAudit } from '@/lib/audit';
import { money } from '@/lib/money';

/** Public link: no session, so the only protection is the rate limit and the id. */
const MAX_SUBMISSIONS_PER_MINUTE = 20;

class BookingError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function seatsSold(eventId: string): Promise<number> {
  const result = await prisma.eventRegistration.aggregate({
    where: { eventId, status: 'confirmed' },
    _sum: { seats: true },
  });
  return result._sum.seats || 0;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const event = await prisma.event.findFirst({
      where: { id, status: 'published' },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        startAt: true,
        endAt: true,
        location: true,
        capacity: true,
        ticketPrice: true,
      },
    });

    if (!event) return NextResponse.json({ error: 'This event is not open for registration' }, { status: 404 });

    const sold = await seatsSold(id);
    return NextResponse.json({
      event: { ...event, ticketPrice: money(event.ticketPrice) },
      seatsLeft: event.capacity > 0 ? Math.max(0, event.capacity - sold) : null,
    });
  } catch (error) {
    console.error('Public event GET failed', error);
    return NextResponse.json({ error: 'This event is not open for registration' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limit = await rateLimit(req, { maxRequests: MAX_SUBMISSIONS_PER_MINUTE, windowMs: 60_000 });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many bookings, please try again in a minute' }, { status: 429 });
  }

  const { id } = await params;

  try {
    const body = await req.json().catch(() => ({}));
    const attendeeName = String(body.attendeeName || '').trim();
    const attendeeEmail = body.attendeeEmail ? String(body.attendeeEmail).trim() : null;
    const seats = Math.max(1, Math.min(20, Math.round(Number(body.seats) || 1)));

    if (!attendeeName) return NextResponse.json({ error: 'Please enter your name' }, { status: 400 });
    if (attendeeName.length > 120) return NextResponse.json({ error: 'Name is too long' }, { status: 400 });
    if (attendeeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(attendeeEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    const registration = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT id FROM events WHERE id = ${id} FOR UPDATE`;
      const event = await tx.event.findUnique({ where: { id } });
      if (!event || event.status !== 'published') {
        throw new BookingError(404, 'This event is not open for registration');
      }

      if (event.capacity > 0) {
        const taken = await tx.eventRegistration.aggregate({
          where: { eventId: id, status: 'confirmed' },
          _sum: { seats: true },
        });
        const used = taken._sum.seats || 0;
        if (used + seats > event.capacity) {
          throw new BookingError(400, `Only ${Math.max(0, event.capacity - used)} seat(s) left`);
        }
      }

      return tx.eventRegistration.create({
        data: {
          eventId: id,
          attendeeName,
          attendeeEmail,
          seats,
          amount: Math.round(seats * money(event.ticketPrice) * 100) / 100,
          status: 'confirmed',
        },
        include: { event: { select: { companyId: true, title: true } } },
      });
    });

    if (registration.event.companyId) {
      await recordAudit({
        companyId: registration.event.companyId,
        entity: 'registration',
        entityId: registration.id,
        action: 'created',
        actor: { email: attendeeEmail || 'public-link' },
        summary: `Public booking · ${attendeeName} · ${seats} seat(s) · ${money(registration.amount)}`,
      });
    }

    return NextResponse.json(
      {
        success: true,
        registration: {
          id: registration.id,
          attendeeName: registration.attendeeName,
          seats: registration.seats,
          amount: money(registration.amount),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof BookingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'This event is no longer available' }, { status: 404 });
    }
    console.error('Public event POST failed', error);
    return NextResponse.json({ error: 'Could not complete this booking' }, { status: 500 });
  }
}
