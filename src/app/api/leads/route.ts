import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const leads = await prisma.lead.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
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
    const extraNotes = [body.notes || null, body.estimatedValue ? `Estimated value: ${body.estimatedValue}` : null, body.designation ? `Designation: ${body.designation}` : null].filter(Boolean).join(' \u00b7 ');
    const lead = await prisma.lead.create({
      data: {
        name: body.name || 'Unnamed Lead',
        email: body.email || null,
        phone: body.phone || null,
        company: body.company || null,
        source: body.source || 'manual',
        status: body.status || 'new',
        notes: extraNotes || null,
        companyId: user.companyId,
        assignedTo: user.id,
      }
    });
    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('Error creating lead:', error);
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

    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing || existing.companyId !== user.companyId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (rest.name !== undefined) data.name = rest.name;
    if (rest.email !== undefined) data.email = rest.email;
    if (rest.phone !== undefined) data.phone = rest.phone;
    if (rest.company !== undefined) data.company = rest.company;
    if (rest.source !== undefined) data.source = rest.source;
    if (rest.status !== undefined) data.status = rest.status;
    if (rest.score !== undefined) data.score = Number(rest.score);
    if (rest.notes !== undefined) data.notes = rest.notes;

    const lead = await prisma.lead.update({ where: { id }, data });
    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error updating lead:', error);
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

    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing || existing.companyId !== user.companyId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.lead.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
