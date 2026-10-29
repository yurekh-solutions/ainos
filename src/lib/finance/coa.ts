// Base Chart of Accounts for AINOS Finance (double-entry).
// Kept intentionally small: one account per posting concern so the ledger is
// easy to read and every business starts from the same, correct skeleton.

import { Prisma } from '@prisma/client';

export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

export interface CoreAccount {
  code: string;
  name: string;
  type: AccountType;
  description?: string;
}

// Canonical account codes used across the posting helpers in ledger.ts.
export const ACCOUNTS = {
  CASH: '1000', // Cash / Bank (asset)
  RECEIVABLE: '1100', // Accounts Receivable — customers owe us (asset)
  PAYABLE: '1200', // Accounts Payable — we owe vendors (liability)
  OUTPUT_GST: '2100', // GST collected on sales, payable to govt (liability)
  TCS_RECEIVABLE: '2150', // TCS paid, adjustable (asset)
  ITC: '2200', // Input Tax Credit — GST paid on purchases (asset)
  OWNER_EQUITY: '3000', // Owner's equity / capital (equity)
  REVENUE: '4000', // Sales revenue (income)
  OTHER_INCOME: '4100', // Non-operating income (income)
  EXPENSE: '5000', // Operating expenses (expense)
} as const;

export const CORE_ACCOUNTS: CoreAccount[] = [
  { code: ACCOUNTS.CASH, name: 'Cash & Bank', type: 'asset', description: 'Cash at hand and bank balances' },
  { code: ACCOUNTS.RECEIVABLE, name: 'Accounts Receivable', type: 'asset', description: 'Amounts customers owe' },
  { code: ACCOUNTS.ITC, name: 'Input Tax Credit (GST)', type: 'asset', description: 'Recoverable GST paid on purchases' },
  { code: ACCOUNTS.TCS_RECEIVABLE, name: 'TCS Receivable', type: 'asset', description: 'TCS paid, adjustable against liability' },
  { code: ACCOUNTS.PAYABLE, name: 'Accounts Payable', type: 'liability', description: 'Amounts owed to vendors' },
  { code: ACCOUNTS.OUTPUT_GST, name: 'Output GST Payable', type: 'liability', description: 'GST collected, payable to government' },
  { code: ACCOUNTS.OWNER_EQUITY, name: "Owner's Equity", type: 'equity', description: 'Owner capital' },
  { code: ACCOUNTS.REVENUE, name: 'Sales Revenue', type: 'income', description: 'Revenue from invoices' },
  { code: ACCOUNTS.OTHER_INCOME, name: 'Other Income', type: 'income', description: 'Non-operating income' },
  { code: ACCOUNTS.EXPENSE, name: 'Operating Expenses', type: 'expense', description: 'Business expenses' },
];

// Minimal shape so both `PrismaClient` and a transaction client satisfy it.
type AccountClient = Prisma.TransactionClient;

/**
 * Idempotently ensures the company has the base chart of accounts.
 * Safe to call before every posting — it only inserts what is missing and
 * refreshes the immutable metadata (name/type/description) for existing rows.
 */
export async function ensureChartOfAccounts(client: AccountClient, companyId: string): Promise<void> {
  for (const acc of CORE_ACCOUNTS) {
    const existing = await client.account.findFirst({
      where: { companyId, code: acc.code },
    });
    if (!existing) {
      await client.account.create({
        data: {
          code: acc.code,
          name: acc.name,
          type: acc.type,
          description: acc.description ?? null,
          companyId,
        },
      });
    } else {
      await client.account.update({
        where: { id: existing.id },
        data: { name: acc.name, type: acc.type, description: acc.description ?? null, isActive: true },
      });
    }
  }
}
