// Shared e-invoice registration helper used by both the single and bulk
// API routes. Loads the tenant-scoped invoice + company, builds the NICV,
// calls the active provider, and persists the IRN/QR/ack + status.

import { prisma } from '@/lib/prisma';
import { buildNicv, type EinvoiceInvoice } from './nicv';
import { getProvider } from './provider';

export interface EinvoiceOutcome {
  ok: boolean;
  invoiceId: string;
  invoiceNumber: string;
  status: 'registered' | 'failed';
  irn?: string;
  error?: string;
}

export async function registerInvoiceEinvoice(invoiceId: string, companyId: string): Promise<EinvoiceOutcome> {
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, companyId } });
  if (!invoice) {
    return { ok: false, invoiceId, invoiceNumber: '', status: 'failed', error: 'Invoice not found' };
  }
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    return { ok: false, invoiceId, invoiceNumber: invoice.invoiceNumber, status: 'failed', error: 'Company not found' };
  }

  const nicv = buildNicv(invoice as unknown as EinvoiceInvoice, {
    name: company.name,
    gstNumber: company.gstNumber,
    gstinStateCode: company.gstinStateCode,
    address: company.address,
    state: company.state,
    phone: company.phone,
    email: company.email,
  });

  try {
    const res = await getProvider().register(nicv);
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        einvoiceIrn: res.irn,
        einvoiceQr: res.qr,
        einvoiceAck: res.ackNo,
        einvoiceStatus: 'registered',
        einvoiceAt: new Date(),
      },
    });
    return { ok: true, invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, status: 'registered', irn: res.irn };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Registration failed';
    await prisma.invoice.update({ where: { id: invoice.id }, data: { einvoiceStatus: 'failed' } }).catch(() => {});
    return { ok: false, invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, status: 'failed', error: msg };
  }
}
