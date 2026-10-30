import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { registerInvoiceEinvoice } from '@/lib/finance/einvoice/register';

async function resolveUser(req: NextRequest) {
  const session = await getServerSession(req);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user?.companyId) return null;
  return { id: user.id, companyId: user.companyId };
}

// Register (or re-register) a single invoice for e-invoicing.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await resolveUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const outcome = await registerInvoiceEinvoice(id, user.companyId);

    if (!outcome.ok) {
      const status = outcome.error === 'Invoice not found' ? 404 : 502;
      return NextResponse.json({ error: outcome.error || 'Registration failed' }, { status });
    }
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    return NextResponse.json(invoice);
  } catch (error) {
    console.error('E-invoice register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
