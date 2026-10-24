import { NextResponse, type NextRequest } from 'next/server';
import { type EventRegistration, type Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/permissions';
import { recordAudit } from '@/lib/audit';
import { money } from '@/lib/money';

const STATUSES = ['confirmed', 'cancelled'];

/** Thrown inside a transaction so the whole unit rolls back with a clean status. */
class RegistrationError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function presentRegistration(row: EventRegistration) {
  return { ...row, amount: money(row.amount) };
}

async function confirmedSeats(client: Prisma.TransactionClient, eventId: string, excludeId?: string): Promise<number> {
  const result = await client.eventRegistration.aggregate({
    where: { eventId, status: 'confirmed', ...(excludeId ? { id: { not: excludeId } } : {}) },
    _sum: { seats: true },
  });
  return result._sum.seats || 0;
}

/**
 * Serialises allocation for one event: the row lock makes the read-then-write
 * capacity check atomic, so two simultaneous bookings can never oversell.
 */
async function lockEvent(client: Prisma.TransactionClient, eventId: string) {
  await client.$executeRaw`SELECT id FROM events WHERE id = ${eventId} FOR UPDATE`;
  return client.event.findUnique({ where: { id: eventId } });
}

export async function POST(req: NextRequest) {
  const ctx = await requireSession(req);
  if (ctx.error) return ctx.error;

  try {
    const body = await req.json();
    const eventId = String(body.eventId || '');
    const attendeeName = String(body.attendeeName || '').trim();
    const seats = Math.max(1, Math.round(Number(body.seats) || 1));

    if (!eventId) return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    if (!attendeeName) return NextResponse.json({ error: 'Attendee name is required' }, { status: 400 });

    const registration = await prisma.$transaction(async (tx) => {
      const event = await lockEvent(tx, eventId);
      if (!event || event.companyId !== ctx.companyId) throw new RegistrationError(404, 'Event not found');
      if (event.status !== 'published') {
        throw new RegistrationError(400, 'This event is not open for registration');
      }

      if (event.capacity > 0) {
        const taken = await confirmedSeats(tx, eventId);
        if (taken + seats > event.capacity) {
          throw new RegistrationError(400, `Only ${Math.max(0, event.capacity - taken)} seats left`);
        }
      }

      return tx.eventRegistration.create({
        data: {
          eventId,
          attendeeName,
          attendeeEmail: body.attendeeEmail ? String(body.attendeeEmail).trim() : null,
          seats,
          amount: Math.round(seats * money(event.ticketPrice) * 100) / 100,
          status: 'confirmed',
        },
      });
    });

    await recordAudit({
      companyId: ctx.companyId,
      entity: 'registration',
      entityId: registration.id,
      action: 'created',
      actor: ctx.user,
      summary: `${registration.attendeeName} · ${registration.seats} seat(s)`,
    });

    return NextResponse.json({ registration: presentRegistration(registration) }, { status: 201 });
  } catch (error) {
    if (error instanceof RegistrationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Event registration POST failed', error);
    return NextResponse.json({ error: 'Could not register this attendee' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const ctx = await requireSession(req);
  if (ctx.error) return ctx.error;

  try {
    const body = await req.json();
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'Registration id is required' }, { status: 400 });
    if (!STATUSES.includes(body.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

    const registration = await prisma.$transaction(async (tx) => {
      const existing = await tx.eventRegistration.findFirst({
        where: { id, event: { companyId: ctx.companyId } },
        include: { event: true },
      });
      if (!existing) throw new RegistrationError(404, 'Registration not found');

      const seats = body.seats !== undefined ? Math.max(1, Math.round(Number(body.seats) || 1)) : existing.seats;
      const event = await lockEvent(tx, existing.eventId);
      if (!event) throw new RegistrationError(404, 'Event not found');

      // Seats only count against capacity while the row is confirmed.
      if (body.status === 'confirmed' && event.capacity > 0) {
        const taken = await confirmedSeats(tx, existing.eventId, id);
        if (taken + seats > event.capacity) {
          throw new RegistrationError(400, 'Event is already at capacity');
        }
      }

      return tx.eventRegistration.update({
        where: { id },
        data: {
          status: body.status,
          seats,
          attendeeName: body.attendeeName ? String(body.attendeeName).trim() : existing.attendeeName,
          attendeeEmail: body.attendeeEmail !== undefined
            ? (body.attendeeEmail ? String(body.attendeeEmail).trim() : null)
            : existing.attendeeEmail,
        },
      });
    });

    await recordAudit({
      companyId: ctx.companyId,
      entity: 'registration',
      entityId: registration.id,
      action: registration.status === 'cancelled' ? 'cancelled' : 'updated',
      actor: ctx.user,
      summary: `${registration.attendeeName} → ${registration.status}`,
    });

    return NextResponse.json({ registration: presentRegistration(registration) });
  } catch (error) {
    if (error instanceof RegistrationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Event registration PATCH failed', error);
    return NextResponse.json({ error: 'Could not update this registration' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const ctx = await requireSession(req);
  if (ctx.error) return ctx.error;
  if (!ctx.permissions.canDelete) {
    return NextResponse.json({ error: 'Only an owner or admin can delete registrations' }, { status: 403 });
  }

  try {
    const id = new URL(req.url).searchParams.get('id') || '';
    if (!id) return NextResponse.json({ error: 'Registration id is required' }, { status: 400 });

    const existing = await prisma.eventRegistration.findFirst({
      where: { id, event: { companyId: ctx.companyId } },
    });
    if (!existing) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });

    await recordAudit({
      companyId: ctx.companyId,
      entity: 'registration',
      entityId: existing.id,
      action: 'deleted',
      actor: ctx.user,
      summary: `${existing.attendeeName} · ${existing.seats} seat(s) removed`,
    });

    await prisma.eventRegistration.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Event registration DELETE failed', error);
    return NextResponse.json({ error: 'Could not delete this registration' }, { status: 500 });
  }
}
