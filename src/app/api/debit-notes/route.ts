import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { postDebitNote, removeSource } from '@/lib/finance/ledger';

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

// Adapt a stored DebitNote row to the ledger posting shape.
const toNoteDoc = (n: {
  id: string; companyId: string | null; noteNumber: string; subtotal: number | null;
  tax: number | null; total: number | null; status: string; vendorName: string | null;
}) => ({
  id: n.id, companyId: n.companyId || '', noteNumber: n.noteNumber,
  subtotal: n.subtotal, tax: n.tax, total: n.total, status: n.status || 'draft',
  partyName: n.vendorName,
});

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
    // Collision-safe numbering (noteNumber is globally unique)
    const dnYear = new Date().getFullYear();
    let dnN = (await prisma.debitNote.count({ where: { companyId: user.companyId } })) + 1;
    let noteNumber = `DN-${String(dnN).padStart(4, '0')}-${dnYear}`;
    while (await prisma.debitNote.findUnique({ where: { noteNumber } })) {
      dnN += 1;
      noteNumber = `DN-${String(dnN).padStart(4, '0')}-${dnYear}`;
    }

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
        total: body.total || body.amount || 0,
        reason: body.reason || null,
        status: body.status || 'draft',
        companyId: user.companyId,
      },
    });
    await postDebitNote(prisma, toNoteDoc(note));
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create debit note' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const id = String(body.id || new URL(req.url).searchParams.get('id') || '');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const existing = await prisma.debitNote.findUnique({ where: { id } });
    if (!existing || existing.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Debit note not found' }, { status: 404 });
    }

    // Explicit whitelist: only these columns can be written.
    const data: Prisma.DebitNoteUpdateInput = {};

    if (body.vendorId !== undefined) data.vendorId = body.vendorId ? String(body.vendorId) : null;
    if (body.vendorName !== undefined) data.vendorName = body.vendorName ? String(body.vendorName).trim() : null;
    if (body.purchaseId !== undefined) data.purchaseId = body.purchaseId ? String(body.purchaseId) : null;
    if (body.reason !== undefined) data.reason = body.reason ? String(body.reason).trim() : null;
    if (body.status !== undefined) data.status = String(body.status);
    if (body.items !== undefined) {
      data.items = body.items === null ? Prisma.JsonNull : (body.items as unknown as Prisma.InputJsonValue);
    }

    if (body.subtotal !== undefined) data.subtotal = toNumber(body.subtotal);
    if (body.tax !== undefined) data.tax = toNumber(body.tax);
    if (body.cgstAmount !== undefined) data.cgstAmount = toNumber(body.cgstAmount);
    if (body.sgstAmount !== undefined) data.sgstAmount = toNumber(body.sgstAmount);
    if (body.igstAmount !== undefined) data.igstAmount = toNumber(body.igstAmount);
    if (body.total !== undefined || body.amount !== undefined) data.total = toNumber(body.total ?? body.amount);

    const note = await prisma.debitNote.update({ where: { id }, data });
    await postDebitNote(prisma, toNoteDoc(note));
    return NextResponse.json(note);
  } catch (error) {
    console.error('Error updating debit note:', error);
    return NextResponse.json({ error: 'Failed to update debit note' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 401 });

    const id = new URL(req.url).searchParams.get('id') || '';
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const existing = await prisma.debitNote.findUnique({ where: { id } });
    if (!existing || existing.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Debit note not found' }, { status: 404 });
    }

    await prisma.debitNote.delete({ where: { id } });
    await removeSource(prisma, 'DEBIT_NOTE', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting debit note:', error);
    return NextResponse.json({ error: 'Failed to delete debit note' }, { status: 500 });
  }
}
