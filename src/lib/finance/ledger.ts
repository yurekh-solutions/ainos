// Double-entry posting engine for AINOS Finance.
// Every source document (invoice, payment, expense, note) maps to exactly one
// balanced JournalEntry, keyed by a stable `reference` so re-saving a document
// reconciles the ledger instead of duplicating it (idempotent per source doc).

import { Prisma, PrismaClient } from '@prisma/client';
import { ACCOUNTS, ensureChartOfAccounts } from './coa';

type Db = PrismaClient;
type Tx = Prisma.TransactionClient;

export interface JournalLine {
  code: string;
  debit?: number;
  credit?: number;
  description?: string;
}

const r2 = (n: number) => Math.round((Number.isFinite(n) ? n : 0) * 100) / 100;

const reference = (sourceType: string, sourceId: string) => `${sourceType}:${sourceId}`;

async function resolveAccountIds(tx: Tx, companyId: string, codes: string[]): Promise<Map<string, string>> {
  const accounts = await tx.account.findMany({
    where: { companyId, code: { in: codes } },
    select: { id: true, code: true },
  });
  const map = new Map<string, string>();
  for (const a of accounts) map.set(a.code, a.id);
  return map;
}

/** Deletes any journal (and its lines) previously written for this source. */
async function clearSource(tx: Tx, ref: string): Promise<void> {
  await tx.ledgerEntry.deleteMany({ where: { journal: { reference: ref } } });
  await tx.journalEntry.deleteMany({ where: { reference: ref } });
}

/**
 * Writes a balanced journal for a source document. Silently no-ops when the
 * lines do not balance (guards against bad data ever corrupting the ledger).
 * Returns true when a journal was written.
 */
async function writeSource(
  db: Db,
  opts: {
    companyId: string;
    sourceType: string;
    sourceId: string;
    date: Date;
    description?: string | null;
    lines: JournalLine[];
  },
): Promise<boolean> {
  const { companyId, sourceType, sourceId } = opts;
  const ref = reference(sourceType, sourceId);

  return db.$transaction(async (tx) => {
    await ensureChartOfAccounts(tx, companyId);
    await clearSource(tx, ref);

    // Drop zero lines, then require Dr == Cr before writing anything.
    const lines = opts.lines
      .map(l => ({ ...l, debit: r2(l.debit || 0), credit: r2(l.credit || 0) }))
      .filter(l => l.debit > 0 || l.credit > 0);

    const totalDebit = r2(lines.reduce((s, l) => s + l.debit, 0));
    const totalCredit = r2(lines.reduce((s, l) => s + l.credit, 0));
    if (!lines.length || Math.abs(totalDebit - totalCredit) > 0.01) {
      return false;
    }

    const ids = await resolveAccountIds(tx, companyId, lines.map(l => l.code));
    if (lines.some(l => !ids.get(l.code))) return false; // missing account → skip safely

    const journal = await tx.journalEntry.create({
      data: {
        date: opts.date,
        description: opts.description ?? null,
        reference: ref,
        status: 'posted',
        companyId,
      },
    });

    for (const line of lines) {
      const accountId = ids.get(line.code)!;
      await tx.ledgerEntry.create({
        data: {
          journalId: journal.id,
          accountId,
          debit: line.debit,
          credit: line.credit,
          description: line.description ?? null,
        },
      });
      // Maintain the running net (debit-positive) balance cache on the account.
      await tx.account.update({
        where: { id: accountId },
        data: { balance: { increment: r2(line.debit - line.credit) } },
      });
    }
    return true;
  });
}

// ── Source shapes (structural — only the fields we post on) ──────────────

export interface InvoiceDoc {
  id: string;
  companyId: string | null;
  invoiceNumber: string;
  status: string;
  subtotal: number | null;
  discountAmount: number | null;
  taxTotal: number | null;
  totalAmount: number | null;
  paidAmount: number | null;
  invoiceDate: Date | null;
  customerName: string | null;
}

export interface ExpenseDoc {
  id: string;
  companyId: string | null;
  title: string | null;
  amount: number;
  taxAmount: number | null;
  status: string;
  date: Date;
}

export interface NoteDoc {
  id: string;
  companyId: string;
  noteNumber: string;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  status: string;
  partyName: string | null;
}

// ── Public posters ───────────────────────────────────────────────────────

/** Dr Receivable / Cr Revenue + Cr Output GST. Draft or void invoices are removed. */
export async function postInvoiceIssued(db: Db, inv: InvoiceDoc): Promise<boolean> {
  if (inv.status === 'draft' || inv.status === 'void') {
    return removeInvoiceIssued(db, inv);
  }
  const revenue = r2(Math.max(0, (inv.subtotal || 0) - (inv.discountAmount || 0)));
  const tax = r2(inv.taxTotal || 0);
  if (revenue <= 0 && tax <= 0) return removeInvoiceIssued(db, inv);
  if (!inv.companyId) return false;

  return writeSource(db, {
    companyId: inv.companyId,
    sourceType: 'INVOICE',
    sourceId: inv.id,
    date: inv.invoiceDate || new Date(),
    description: `Invoice ${inv.invoiceNumber}${inv.customerName ? ` — ${inv.customerName}` : ''}`,
    lines: [
      { code: ACCOUNTS.RECEIVABLE, debit: r2(revenue + tax), description: 'Receivable' },
      { code: ACCOUNTS.REVENUE, credit: revenue, description: 'Sales revenue' },
      ...(tax > 0 ? [{ code: ACCOUNTS.OUTPUT_GST, credit: tax, description: 'GST collected' }] : []),
    ],
  });
}

/** Removes the invoice-issued journal (used when an invoice returns to draft/void). */
export async function removeInvoiceIssued(db: Db, inv: InvoiceDoc): Promise<boolean> {
  const ref = reference('INVOICE', inv.id);
  await db.$transaction(async (tx) => { await clearSource(tx, ref); });
  return true;
}

/** Dr Cash / Cr Receivable for the amount actually collected. */
export async function postInvoicePayment(db: Db, inv: InvoiceDoc): Promise<boolean> {
  const paid = r2(inv.paidAmount || 0);
  const ref = reference('INVOICE_PAYMENT', inv.id);
  if (inv.status === 'draft' || inv.status === 'void' || paid <= 0 || !inv.companyId) {
    await db.$transaction(async (tx) => { await clearSource(tx, ref); });
    return true;
  }
  return writeSource(db, {
    companyId: inv.companyId,
    sourceType: 'INVOICE_PAYMENT',
    sourceId: inv.id,
    date: inv.invoiceDate || new Date(),
    description: `Payment received on ${inv.invoiceNumber}`,
    lines: [
      { code: ACCOUNTS.CASH, debit: paid, description: 'Cash/Bank in' },
      { code: ACCOUNTS.RECEIVABLE, credit: paid, description: 'Settles receivable' },
    ],
  });
}

/** Dr Expense + Dr ITC / Cr Cash. Only approved or reimbursed claims post. */
export async function postExpense(db: Db, exp: ExpenseDoc): Promise<boolean> {
  const ref = reference('EXPENSE', exp.id);
  if (exp.status !== 'approved' && exp.status !== 'reimbursed') {
    await db.$transaction(async (tx) => { await clearSource(tx, ref); });
    return true;
  }
  const amount = r2(exp.amount || 0);
  const itc = r2(exp.taxAmount || 0);
  if (!exp.companyId || (amount <= 0 && itc <= 0)) {
    await db.$transaction(async (tx) => { await clearSource(tx, ref); });
    return true;
  }
  return writeSource(db, {
    companyId: exp.companyId,
    sourceType: 'EXPENSE',
    sourceId: exp.id,
    date: exp.date || new Date(),
    description: `Expense — ${exp.title || 'Expense'}`,
    lines: [
      { code: ACCOUNTS.EXPENSE, debit: amount, description: 'Expense' },
      ...(itc > 0 ? [{ code: ACCOUNTS.ITC, debit: itc, description: 'Input tax credit' }] : []),
      { code: ACCOUNTS.CASH, credit: r2(amount + itc), description: 'Cash/Bank out' },
    ],
  });
}

/** Credit note (customer side): Dr Revenue + Dr Output GST / Cr Receivable. */
export async function postCreditNote(db: Db, note: NoteDoc): Promise<boolean> {
  const ref = reference('CREDIT_NOTE', note.id);
  if (note.status === 'draft' || note.status === 'void') {
    await db.$transaction(async (tx) => { await clearSource(tx, ref); });
    return true;
  }
  const revenue = r2(note.subtotal || 0);
  const tax = r2(note.tax || 0);
  const total = r2(note.total || revenue + tax);
  if (total <= 0) {
    await db.$transaction(async (tx) => { await clearSource(tx, ref); });
    return true;
  }
  return writeSource(db, {
    companyId: note.companyId,
    sourceType: 'CREDIT_NOTE',
    sourceId: note.id,
    date: new Date(),
    description: `Credit note ${note.noteNumber}${note.partyName ? ` — ${note.partyName}` : ''}`,
    lines: [
      ...(revenue > 0 ? [{ code: ACCOUNTS.REVENUE, debit: revenue, description: 'Revenue reversal' }] : []),
      ...(tax > 0 ? [{ code: ACCOUNTS.OUTPUT_GST, debit: tax, description: 'GST reversal' }] : []),
      { code: ACCOUNTS.RECEIVABLE, credit: total, description: 'Reduces receivable' },
    ],
  });
}

/** Debit note (vendor side): Dr Expense + Dr ITC / Cr Payable. */
export async function postDebitNote(db: Db, note: NoteDoc): Promise<boolean> {
  const ref = reference('DEBIT_NOTE', note.id);
  if (note.status === 'draft' || note.status === 'void') {
    await db.$transaction(async (tx) => { await clearSource(tx, ref); });
    return true;
  }
  const base = r2(note.subtotal || 0);
  const tax = r2(note.tax || 0);
  const total = r2(note.total || base + tax);
  if (total <= 0) {
    await db.$transaction(async (tx) => { await clearSource(tx, ref); });
    return true;
  }
  return writeSource(db, {
    companyId: note.companyId,
    sourceType: 'DEBIT_NOTE',
    sourceId: note.id,
    date: new Date(),
    description: `Debit note ${note.noteNumber}${note.partyName ? ` — ${note.partyName}` : ''}`,
    lines: [
      ...(base > 0 ? [{ code: ACCOUNTS.EXPENSE, debit: base, description: 'Expense increase' }] : []),
      ...(tax > 0 ? [{ code: ACCOUNTS.ITC, debit: tax, description: 'Input tax credit' }] : []),
      { code: ACCOUNTS.PAYABLE, credit: total, description: 'Increases payable' },
    ],
  });
}

/** Full cleanup when a source document is deleted. */
export async function removeSource(db: Db, sourceType: string, sourceId: string): Promise<void> {
  const ref = reference(sourceType, sourceId);
  await db.$transaction(async (tx) => { await clearSource(tx, ref); });
}
