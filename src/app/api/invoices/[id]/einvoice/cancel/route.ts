import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getProvider } from '@/lib/finance/einvoice/provider';

async function resolveUser(req: NextRequest) {
  const session = await getServerSession(req);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user?.companyId) return null;
  return { id: user.id, companyId: user.companyId };
}

// Cancel a registered e-invoice. Sandbox provider no-ops the network call and
// only flips local status; a real provider would POST the IRP cancel endpoint.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await resolveUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const invoice = await prisma.invoice.findFirst({ where: { id, companyId: user.companyId } });
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    if (!invoice.einvoiceIrn) return NextResponse.json({ error: 'Invoice is not e-invoiced' }, { status: 400 });

    await getProvider().cancel?.(invoice.einvoiceIrn, invoice.einvoiceAck || undefined);

    const updated = await prisma.invoice.update({
      where: { id: invoice.id },
      data: { einvoiceStatus: 'cancelled' },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('E-invoice cancel error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
