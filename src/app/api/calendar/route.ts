import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    const where: Record<string, unknown> = { companyId: user.companyId };
    if (start && end) {
      where.startTime = { gte: new Date(start), lte: new Date(end) };
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: { startTime: 'asc' }
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
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
    const event = await prisma.calendarEvent.create({
      data: {
        title: body.title || 'Untitled Event',
        description: body.description || null,
        location: body.location || null,
        attendees: Array.isArray(body.attendees) ? body.attendees : null,
        status: body.status || 'confirmed',
        companyId: user.companyId,
        startTime: (body.startTime || body.startDate) ? new Date(body.startTime || body.startDate) : new Date(),
        endTime: (body.endTime || body.endDate) ? new Date(body.endTime || body.endDate) : null,
      }
    });
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id, ...rest } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const existing = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!existing || existing.companyId !== user.companyId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (rest.title !== undefined) data.title = rest.title;
    if (rest.description !== undefined) data.description = rest.description;
    if (rest.location !== undefined) data.location = rest.location;
    if (rest.attendees !== undefined) data.attendees = Array.isArray(rest.attendees) ? rest.attendees : null;
    if (rest.status !== undefined) data.status = rest.status;
    if (rest.startTime !== undefined || rest.startDate !== undefined) data.startTime = (rest.startTime || rest.startDate) ? new Date(rest.startTime || rest.startDate) : null;
    if (rest.endTime !== undefined || rest.endDate !== undefined) data.endTime = (rest.endTime || rest.endDate) ? new Date(rest.endTime || rest.endDate) : null;

    const event = await prisma.calendarEvent.update({ where: { id }, data });
    return NextResponse.json(event);
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const existing = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!existing || existing.companyId !== user.companyId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.calendarEvent.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
