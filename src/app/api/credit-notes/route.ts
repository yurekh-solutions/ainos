import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { postCreditNote, removeSource } from '@/lib/finance/ledger';

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

// Adapt a stored CreditNote row to the ledger posting shape.
const toNoteDoc = (n: {
  id: string; companyId: string | null; noteNumber: string; subtotal: number | null;
  tax: number | null; total: number | null; status: string; customerName: string | null;
}) => ({
  id: n.id, companyId: n.companyId || '', noteNumber: n.noteNumber,
  subtotal: n.subtotal, tax: n.tax, total: n.total, status: n.status || 'draft',
  partyName: n.customerName,
});

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
    await postCreditNote(prisma, toNoteDoc(note));
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create credit note' }, { status: 500 });
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

    const existing = await prisma.creditNote.findUnique({ where: { id } });
    if (!existing || existing.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Credit note not found' }, { status: 404 });
    }

    // Explicit whitelist: only these columns can be written.
    const data: Prisma.CreditNoteUpdateInput = {};

    if (body.customerId !== undefined) data.customerId = body.customerId ? String(body.customerId) : null;
    if (body.customerName !== undefined) data.customerName = body.customerName ? String(body.customerName).trim() : null;
    if (body.reason !== undefined) data.reason = body.reason ? String(body.reason).trim() : null;
    if (body.status !== undefined) data.status = String(body.status);
    if (body.items !== undefined) {
      data.items = body.items === null ? Prisma.JsonNull : (body.items as unknown as Prisma.InputJsonValue);
    }

    if (body.invoiceId !== undefined) data.invoiceId = body.invoiceId ? String(body.invoiceId) : null;
    // The table stores invoiceId; accept invoiceNumber as well and resolve it inside the tenant.
    if (!body.invoiceId && body.invoiceNumber !== undefined) {
      const invoiceNumber = body.invoiceNumber ? String(body.invoiceNumber).trim() : '';
      if (invoiceNumber) {
        const invoice = await prisma.invoice.findFirst({
          where: { invoiceNumber, companyId: user.companyId },
          select: { id: true },
        });
        if (invoice) data.invoiceId = invoice.id;
      }
    }

    if (body.subtotal !== undefined) data.subtotal = toNumber(body.subtotal);
    if (body.tax !== undefined) data.tax = toNumber(body.tax);
    if (body.cgstAmount !== undefined) data.cgstAmount = toNumber(body.cgstAmount);
    if (body.sgstAmount !== undefined) data.sgstAmount = toNumber(body.sgstAmount);
    if (body.igstAmount !== undefined) data.igstAmount = toNumber(body.igstAmount);
    if (body.total !== undefined || body.amount !== undefined) data.total = toNumber(body.total ?? body.amount);

    const note = await prisma.creditNote.update({ where: { id }, data });
    await postCreditNote(prisma, toNoteDoc(note));
    return NextResponse.json(note);
  } catch (error) {
    console.error('Error updating credit note:', error);
    return NextResponse.json({ error: 'Failed to update credit note' }, { status: 500 });
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

    const existing = await prisma.creditNote.findUnique({ where: { id } });
    if (!existing || existing.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Credit note not found' }, { status: 404 });
    }

    await prisma.creditNote.delete({ where: { id } });
    await removeSource(prisma, 'CREDIT_NOTE', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting credit note:', error);
    return NextResponse.json({ error: 'Failed to delete credit note' }, { status: 500 });
  }
}
