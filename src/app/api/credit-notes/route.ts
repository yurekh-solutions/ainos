import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 401 });

    const notes = await prisma.creditNote.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(notes);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch credit notes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 401 });

    const body = await req.json();
    // Collision-safe numbering (noteNumber is globally unique)
    const cnYear = new Date().getFullYear();
    let cnN = (await prisma.creditNote.count({ where: { companyId: user.companyId } })) + 1;
    let noteNumber = `CN-${String(cnN).padStart(4, '0')}-${cnYear}`;
    while (await prisma.creditNote.findUnique({ where: { noteNumber } })) {
      cnN += 1;
      noteNumber = `CN-${String(cnN).padStart(4, '0')}-${cnYear}`;
    }

    const note = await prisma.creditNote.create({
      data: {
        noteNumber,
        customerId: body.customerId || null,
        customerName: body.customerName || null,
        invoiceId: body.invoiceId || null,
        items: body.items || null,
        subtotal: body.subtotal || 0,
        tax: body.tax || 0,
        cgstAmount: body.cgstAmount || 0,
        sgstAmount: body.sgstAmount || 0,
        igstAmount: body.igstAmount || 0,
        total: body.total || body.amount || 0,
        reason: body.reason || null,
        status: body.status || 'draft',
        companyId: user.companyId,
      },
    });
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create credit note' }, { status: 500 });
  }
}
