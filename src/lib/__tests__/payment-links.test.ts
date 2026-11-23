import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * The collect-payment state machine, tested against an in-memory stand-in for
 * the database. These cases exist because this is the only place in the product
 * where a person without an account can influence money records, so the rules
 * worth proving are: a claim never books anything, a confirmation books exactly
 * once, and no token can reach across a company.
 */

type Row = Record<string, unknown>;
type State = { companies: Row[]; invoices: Row[]; links: Row[] };

const COMPANY = 'co-1';
const OTHER = 'co-2';

vi.mock('@/lib/prisma', () => {
  const state: State = { companies: [], invoices: [], links: [] };
  let seq = 0;
  const nextId = (p: string) => `${p}-${(seq += 1)}`;

  function matches(row: Row, where: Row = {}): boolean {
    for (const [key, want] of Object.entries(where)) {
      const got = row[key];
      if (want && typeof want === 'object' && 'in' in (want as Row)) {
        // Prisma's `status: { in: [...] }` filter, and the only operator the
        // payment-link queries actually use.
        const list = (want as { in: unknown[] }).in;
        if (!list.includes(got)) return false;
        continue;
      }
      if (got !== want) return false;
    }
    return true;
  }

  function apply(row: Row, data: Row): void {
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'object' && 'increment' in (value as Row)) {
        row[key] = Number(row[key] ?? 0) + Number((value as Row).increment);
      } else {
        row[key] = value;
      }
    }
  }

  function sortRows(rows: Row[], orderBy?: Row): Row[] {
    const entry = orderBy ? Object.entries(orderBy)[0] : undefined;
    if (!entry) return rows;
    const [key, dir] = entry;
    const sorted = [...rows].sort((a, b) => {
      const x = a[key] as number | string | Date;
      const y = b[key] as number | string | Date;
      return x < y ? -1 : x > y ? 1 : 0;
    });
    return dir === 'desc' ? sorted.reverse() : sorted;
  }

  /** Links always carry their two relations, the way the real queries do. */
  function withRelations(link: Row): Row {
    const invoice = state.invoices.find((i) => i.id === link.invoiceId);
    const company = state.companies.find((c) => c.id === link.companyId);
    return { ...link, invoice, company };
  }

  const linkModel = {
    findFirst: vi.fn(async ({ where, orderBy }: { where?: Row; orderBy?: Row } = {}) => {
      const hit = sortRows(state.links.filter((l) => matches(l, where ?? {})), orderBy)[0];
      return hit ? withRelations(hit) : null;
    }),
    findUnique: vi.fn(async ({ where }: { where: Row }) => {
      const hit = state.links.find((l) => matches(l, where));
      return hit ? withRelations(hit) : null;
    }),
    findMany: vi.fn(async ({ where, orderBy }: { where?: Row; orderBy?: Row } = {}) =>
      sortRows(state.links.filter((l) => matches(l, where ?? {})), orderBy).map(withRelations)),
    create: vi.fn(async ({ data }: { data: Row }) => {
      const row: Row = {
        id: nextId('link'), status: 'active', views: 0, currency: 'INR', label: 'Full payment',
        amount: 0, claimedAt: null, paidAt: null, expiresAt: null, payerName: null,
        payerUpiId: null, payerRef: null, notes: null, createdAt: new Date(), ...data,
      };
      state.links.push(row);
      return withRelations(row);
    }),
    update: vi.fn(async ({ where, data }: { where: Row; data: Row }) => {
      const row = state.links.find((l) => matches(l, where));
      if (!row) throw new Error('no such payment link');
      apply(row, data);
      return withRelations(row);
    }),
  };

  const prisma = {
    paymentLink: linkModel,
    invoice: {
      findFirst: vi.fn(async ({ where }: { where?: Row } = {}) =>
        state.invoices.find((i) => matches(i, where ?? {})) ?? null),
      update: vi.fn(async ({ where, data }: { where: Row; data: Row }) => {
        const row = state.invoices.find((i) => matches(i, where));
        if (!row) throw new Error('no such invoice');
        apply(row, data);
        return { ...row };
      }),
    },
    company: {
      findUnique: vi.fn(async ({ where }: { where: Row }) =>
        state.companies.find((c) => matches(c, where)) ?? null),
    },
    // The real client defers each operation until the batch runs; promises here
    // are already the mutation, so awaiting them in parallel is equivalent.
    $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
    __state: state,
  };

  return { prisma };
});

vi.mock('@/lib/audit', () => ({ recordAudit: vi.fn(async () => undefined) }));
vi.mock('@/lib/finance/ledger', () => ({ postInvoicePayment: vi.fn(async () => true) }));

import { prisma } from '@/lib/prisma';
import { postInvoicePayment } from '@/lib/finance/ledger';
import {
  claimPaymentLink, confirmPaymentLink, createPaymentLink, PaymentLinkError, readPaymentLink,
} from '@/lib/payment-links';

const state = (prisma as unknown as { __state: State }).__state;

function seedCompany(id = COMPANY, over: Row = {}): Row {
  const row: Row = { id, name: 'Sky Studio', upiId: 'skystudio@okhdfcbank', upiPayeeName: 'Sky Studio', state: '27', logoUrl: null, ...over };
  state.companies.push(row);
  return row;
}

function seedInvoice(over: Row = {}): Row {
  const row: Row = {
    id: 'inv-1', invoiceNumber: 'INV-2026-007', companyId: COMPANY, status: 'sent',
    total: null, totalAmount: 50_000, paidAmount: 0, paidDate: null, paymentMethod: null,
    payments: [], customerName: 'Ravi Towers', dueDate: null, invoiceDate: new Date('2026-11-01'),
    ...over,
  };
  state.invoices.push(row);
  return row;
}

async function openLink(invoiceId = 'inv-1', amount?: number) {
  return createPaymentLink({ companyId: COMPANY, userId: 'u-1', userEmail: 'owner@sky.in', invoiceId, amount });
}

async function errorOf(fn: () => Promise<unknown>): Promise<PaymentLinkError> {
  try {
    await fn();
  } catch (error) {
    return error as PaymentLinkError;
  }
  throw new Error('expected the call to fail, but it succeeded');
}

beforeEach(() => {
  state.companies.length = 0;
  state.invoices.length = 0;
  state.links.length = 0;
  vi.clearAllMocks();
  seedCompany();
  seedInvoice();
});

describe('createPaymentLink', () => {
  it('refuses an invoice that has not been finalised', async () => {
    seedInvoice({ id: 'inv-draft', status: 'draft' });
    const err = await errorOf(() => openLink('inv-draft'));
    expect(err.message).toMatch(/draft/i);
    expect(state.links).toHaveLength(0);
  });

  it('refuses before anything is written when no UPI id is saved', async () => {
    state.companies[0].upiId = null;
    const err = await errorOf(() => openLink());
    expect(err.message).toMatch(/Company profile/i);
    expect(state.links).toHaveLength(0);
  });

  it('never lets a link ask for more than the balance', async () => {
    const err = await errorOf(() => openLink('inv-1', 50_001));
    expect(err.message).toMatch(/at most/i);
  });

  it('defaults to the exact balance and rounds it like a bank', async () => {
    state.invoices[0].totalAmount = 18_450.5;
    state.invoices[0].paidAmount = 4_450.25;
    const { link } = await openLink();
    expect(link.amount).toBe(14_000.25);
    expect(link.currency).toBe('INR');
    expect(link.label).toBe('Full payment');
  });

  it('hands back the same link on a second press so one bill has one QR', async () => {
    const first = await openLink();
    const second = await openLink();
    expect(second.reused).toBe(true);
    expect(second.link.token).toBe(first.link.token);
    expect(state.links).toHaveLength(1);
  });

  it('keeps an advance and a full-payment link apart', async () => {
    await openLink('inv-1', 10_000);
    const full = await openLink();
    expect(full.reused).toBe(false);
    expect(state.links).toHaveLength(2);
  });
});

describe('claimPaymentLink - the payer side books nothing', () => {
  const claim = (token: string, payerRef = '402398174523') =>
    claimPaymentLink({ token, payerRef, payerName: 'Ravi', payerUpiId: 'ravi@ybl' });

  it('marks the claim and leaves the invoice exactly as it was', async () => {
    const { link } = await openLink();
    await claim(link.token as string);

    expect(state.links[0].status).toBe('claimed');
    expect(state.invoices[0].paidAmount).toBe(0);
    expect(state.invoices[0].status).toBe('sent');
    expect(vi.mocked(postInvoicePayment)).not.toHaveBeenCalled();
  });

  it('demands a real UPI reference instead of accepting a shrug', async () => {
    const { link } = await openLink();
    const err = await errorOf(() => claim(link.token as string, '12'));
    expect(err.message).toMatch(/reference number/i);
    expect(state.links[0].status).toBe('active');
  });

  it('strips anything that is not a reference character', async () => {
    const { link } = await openLink();
    await claim(link.token as string, '  4023-9817_4523 ✔  ');
    expect(state.links[0].payerRef).toBe('4023-9817_4523');
  });
});

describe('confirmPaymentLink - the only thing that touches an invoice', () => {
  const owner = { userId: 'u-1', userEmail: 'owner@sky.in' };

  async function claimedLink(amount?: number) {
    const { link } = await openLink('inv-1', amount);
    await claimPaymentLink({ token: link.token as string, payerRef: '402398174523' });
    return link;
  }

  it('posts the payment once and closes the invoice', async () => {
    const link = await claimedLink();
    const result = await confirmPaymentLink({ ...owner, companyId: COMPANY, linkId: link.id as string, action: 'confirm' });

    expect(state.invoices[0].paidAmount).toBe(50_000);
    expect(state.invoices[0].status).toBe('paid');
    expect(state.links[0].status).toBe('paid');
    expect(vi.mocked(postInvoicePayment)).toHaveBeenCalledTimes(1);
    expect((result.invoice as Row).id).toBe('inv-1');
  });

  it('records a part payment without pretending the bill is settled', async () => {
    const link = await claimedLink(20_000);
    await confirmPaymentLink({ ...owner, companyId: COMPANY, linkId: link.id as string, action: 'confirm' });

    expect(state.invoices[0].paidAmount).toBe(20_000);
    expect(state.invoices[0].status).toBe('partial');
    expect(state.invoices[0].paidDate).toBeNull();
  });

  it('appends to the payment history instead of overwriting it', async () => {
    state.invoices[0].paidAmount = 5_000;
    state.invoices[0].payments = [{ date: '2026-11-01T00:00:00.000Z', amount: 5_000, method: 'bank' }];
    const link = await claimedLink(15_000);
    await confirmPaymentLink({ ...owner, companyId: COMPANY, linkId: link.id as string, action: 'confirm' });

    const history = state.invoices[0].payments as Row[];
    expect(history).toHaveLength(2);
    expect(history[0].method).toBe('bank');
    expect(history[1]).toMatchObject({ amount: 15_000, method: 'upi-link' });
    expect(state.invoices[0].paidAmount).toBe(20_000);
  });

  it('cannot be run twice for the same money', async () => {
    const link = await claimedLink();
    await confirmPaymentLink({ ...owner, companyId: COMPANY, linkId: link.id as string, action: 'confirm' });
    const again = await errorOf(() =>
      confirmPaymentLink({ ...owner, companyId: COMPANY, linkId: link.id as string, action: 'confirm' }));

    expect(again.message).toMatch(/already confirmed/i);
    expect(state.invoices[0].paidAmount).toBe(50_000);
    expect(vi.mocked(postInvoicePayment)).toHaveBeenCalledTimes(1);
  });

  it('ignores a link belonging to a different business', async () => {
    const link = await claimedLink();
    const err = await errorOf(() =>
      confirmPaymentLink({ ...owner, companyId: OTHER, linkId: link.id as string, action: 'confirm' }));

    expect(err.status).toBe(404);
    expect(state.invoices[0].paidAmount).toBe(0);
    expect(vi.mocked(postInvoicePayment)).not.toHaveBeenCalled();
  });

  it('sends a wrong claim back without touching the books', async () => {
    const link = await claimedLink();
    await confirmPaymentLink({ ...owner, companyId: COMPANY, linkId: link.id as string, action: 'reject' });

    expect(state.links[0].status).toBe('active');
    expect(state.links[0].claimedAt).toBeNull();
    expect(state.invoices[0].paidAmount).toBe(0);
    expect(vi.mocked(postInvoicePayment)).not.toHaveBeenCalled();
  });
});

describe('readPaymentLink', () => {
  it('flips an overdue link to expired on the visit, with no cron to run', async () => {
    const { link } = await openLink();
    state.links[0].expiresAt = new Date(Date.now() - 60_000);
    const setup = await readPaymentLink(link.token as string);

    expect(setup?.link.status).toBe('expired');
    expect(state.links[0].status).toBe('expired');
  });

  it('warns the payer when the balance has moved since the link was made', async () => {
    const { link } = await openLink();
    state.invoices[0].paidAmount = 30_000;
    const setup = await readPaymentLink(link.token as string);

    expect(setup?.stale).toBe(true);
    expect(setup?.dueNow).toBe(20_000);
  });

  it('says nothing once the invoice behind the link is gone', async () => {
    const { link } = await openLink();
    state.invoices.length = 0;
    await expect(readPaymentLink(link.token as string)).resolves.toBeNull();
  });

  it('stops paying out if the saved UPI id becomes unusable', async () => {
    const { link } = await openLink();
    state.companies[0].upiId = 'not-a-vpa';
    await expect(readPaymentLink(link.token as string)).resolves.toBeNull();
  });

  it('never exposes another tenant\'s invoice through its token', async () => {
    const { link } = await openLink();
    state.links[0].companyId = OTHER;
    seedCompany(OTHER, { upiId: null });
    // No UPI id on that company means nothing can be collected, so nothing leaks.
    await expect(readPaymentLink(link.token as string)).resolves.toBeNull();
  });
});
