import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function optionalDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeTags(value: unknown): string[] | null {
  if (Array.isArray(value)) return value.map((tag: unknown) => String(tag).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((tag: string) => tag.trim()).filter(Boolean);
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const stage = searchParams.get('stage');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = { createdBy: session.user.id || session.user.email };
    if (stage) where.stage = stage;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const contacts = await prisma.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const contact = await prisma.contact.create({
      data: { ...body, createdBy: session.user.id || session.user.email }
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
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

    const actor = session.user.id || session.user.email;
    const existing = await prisma.contact.findUnique({ where: { id: String(id) } });
    if (!existing) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });

    // Contacts created before company scoping have no companyId - fall back to the creator.
    const sameCompany = existing.companyId === user.companyId;
    const legacyOwner = !existing.companyId && existing.createdBy === actor;
    if (!sameCompany && !legacyOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const data: Record<string, unknown> = {};
    if (rest.name !== undefined) {
      const name = String(rest.name || '').trim();
      if (!name) return NextResponse.json({ error: 'Contact name cannot be empty' }, { status: 400 });
      data.name = name;
    }
    if (rest.email !== undefined) data.email = rest.email ? String(rest.email).trim() : null;
    if (rest.phone !== undefined) data.phone = rest.phone ? String(rest.phone).trim() : null;
    if (rest.company !== undefined) data.company = rest.company ? String(rest.company).trim() : null;
    if (rest.tags !== undefined) data.tags = normalizeTags(rest.tags);
    if (rest.dealValue !== undefined) data.dealValue = optionalNumber(rest.dealValue);
    if (rest.lastContacted !== undefined) data.lastContacted = optionalDate(rest.lastContacted);
    if (rest.notes !== undefined) data.notes = rest.notes ? String(rest.notes).trim() : null;
    if (rest.source !== undefined) {
      const source = String(rest.source || '').trim();
      if (source) data.source = source;
    }

    // `status` is accepted as an alias for the contact pipeline stage.
    const nextStage = rest.stage ?? rest.status;
    if (nextStage !== undefined) {
      const stage = String(nextStage || '').trim();
      if (stage) data.stage = stage;
    }

    // Backfill company scoping so later requests are guarded by companyId alone.
    if (!existing.companyId) data.companyId = user.companyId;

    const contact = await prisma.contact.update({ where: { id: existing.id }, data });
    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');
    if (!id) {
      try {
        const body = await req.json();
        id = body?.id ? String(body.id) : null;
      } catch {
        // DELETE without a body is fine - the id can come from the query string.
      }
    }
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const actor = session.user.id || session.user.email;
    const existing = await prisma.contact.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });

    const sameCompany = existing.companyId === user.companyId;
    const legacyOwner = !existing.companyId && existing.createdBy === actor;
    if (!sameCompany && !legacyOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.contact.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
