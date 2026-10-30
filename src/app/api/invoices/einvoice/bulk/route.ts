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

// Bulk e-invoice registration. Body: { ids: string[] }. Continue-on-error:
// each invoice is registered independently and a per-invoice summary returns.
export async function POST(req: NextRequest) {
  try {
    const user = await resolveUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const ids: string[] = Array.isArray(body.ids) ? body.ids.slice(0, 100) : [];
    if (!ids.length) return NextResponse.json({ error: 'No invoices selected' }, { status: 400 });

    const results = [];
    for (const id of ids) {
      const outcome = await registerInvoiceEinvoice(id, user.companyId);
      results.push({
        id: outcome.invoiceId,
        invoiceNumber: outcome.invoiceNumber,
        status: outcome.status,
        irn: outcome.irn,
        error: outcome.error,
      });
    }

    const registered = results.filter((r) => r.status === 'registered').length;
    const failed = results.length - registered;
    return NextResponse.json({ summary: { total: results.length, registered, failed }, results });
  } catch (error) {
    console.error('Bulk e-invoice error:', error);
    return NextResponse.json({ error: 'Failed to register e-invoices' }, { status: 500 });
  }
}
