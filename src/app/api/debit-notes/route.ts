import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 401 });

    const notes = await prisma.debitNote.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(notes);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch debit notes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 401 });

    const body = await req.json();
    const count = await prisma.debitNote.count({ where: { companyId: user.companyId } });
    const noteNumber = `DN-${String(count + 1).padStart(4, '0')}-${new Date().getFullYear()}`;

    const note = await prisma.debitNote.create({
      data: {
        noteNumber,
        vendorId: body.vendorId || null,
        vendorName: body.vendorName || null,
        purchaseId: body.purchaseId || null,
        items: body.items || null,
        subtotal: body.subtotal || 0,
        tax: body.tax || 0,
        cgstAmount: body.cgstAmount || 0,
        sgstAmount: body.sgstAmount || 0,
        igstAmount: body.igstAmount || 0,
        total: body.total || 0,
        reason: body.reason || null,
        status: body.status || 'draft',
        companyId: user.companyId,
      },
    });
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create debit note' }, { status: 500 });
  }
}
