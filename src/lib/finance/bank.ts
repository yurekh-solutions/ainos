// Bank statement reconciliation helpers: flexible Indian-bank CSV parsing plus a
// deterministic matcher that links statement credits (money in) to open invoices.
// Pure functions only (no DB, no React) so they are unit-testable and reusable by
// the /api/bank-reconciliation route and the regression harness.

export interface BankTxn {
  date: string;            // ISO yyyy-mm-dd
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance?: number | null;
}

export interface ParseResult {
  transactions: BankTxn[];
  errors: string[];
}

export interface InvoiceLite {
  id: string;
  invoiceNumber: string;
  customerName: string | null;
  totalAmount: number | null;
  paidAmount: number | null;
  status: string;
}

export type Confidence = 'exact' | 'high' | 'medium';

export interface TxnMatch {
  invoiceId: string;
  invoiceNumber: string;
  customerName: string | null;
  invoiceTotal: number;
  invoicePaid: number;
  outstanding: number;
  allocAmount: number;   // how much of this txn settles toward the invoice
  confidence: Confidence;
  reason: string;
}

export interface ReconcileRow {
  txn: BankTxn;
  match: TxnMatch | null;
  txnId?: string | null;
}

const r2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;
const numv = (v: unknown): number => {
  const n = Number(String(v ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

// ── Date normalisation ───────────────────────────────────────────────────────
// Accepts dd/mm/yyyy, dd-mm-yy, yyyy-mm-dd, dd MMM yyyy, and Excel serials.
export function normalizeDate(raw: string): string | null {
  const s = (raw || '').trim();
  if (!s) return null;
  // ISO already
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  // dd/mm/yyyy or dd/mm/yy or dd-mm-yyyy
  m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (m) {
    const dd = m[1].padStart(2, '0');
    const mm = m[2].padStart(2, '0');
    let yy = m[3]; if (yy.length === 2) yy = '20' + yy;
    return `${yy}-${mm}-${dd}`;
  }
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return null;
}

// ── CSV line splitter (quote-aware) ──────────────────────────────────────────
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else { inQuotes = false; }
      } else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

// Column keywords, in priority order. First matching header wins per field.
const HEADER_PATTERNS: Record<keyof ColumnMap, RegExp> = {
  date: /^(txn\s*date|date|value\s*date|posting\s*date|transaction\s*date)/i,
  description: /(narration|description|details|remarks|particulars|transaction\s*details?|summary)/i,
  reference: /(reference|utr|ch[eé]que|chq|instrument|dcn|ref\s*no|transaction\s*id|sl\.?\s*no)/i,
  credit: /\b(credit|deposit|amount\s*in|cr|inflow|received)\b/i,
  debit: /\b(debit|withdrawal|amount\s*out|dr|outflow|paid)\b/i,
  amount: /^(amount|amt|value|transaction\s*amount)$/i,
  balance: /(closing\s*balance|balance)/i,
};

interface ColumnMap { date: number; description: number; reference: number; credit: number; debit: number; amount: number; balance: number }

/** Parse a bank statement CSV into normalised transactions. Best-effort header detection. */
export function parseBankCsv(text: string): ParseResult {
  const errors: string[] = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { transactions: [], errors: ['Empty file'] };

  // Find the header row: the first line that has a date-ish column.
  let headerIdx = -1;
  let cols: ColumnMap | null = null;
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const cells = splitCsvLine(lines[i]);
    const idxFor = (re: RegExp) => cells.findIndex((c) => re.test(c));
    const date = idxFor(HEADER_PATTERNS.date);
    if (date === -1) continue;
    cols = {
      date,
      description: idxFor(HEADER_PATTERNS.description),
      reference: idxFor(HEADER_PATTERNS.reference),
      credit: idxFor(HEADER_PATTERNS.credit),
      debit: idxFor(HEADER_PATTERNS.debit),
      amount: idxFor(HEADER_PATTERNS.amount),
      balance: idxFor(HEADER_PATTERNS.balance),
    };
    headerIdx = i;
    break;
  }
  if (headerIdx === -1 || !cols) {
    return { transactions: [], errors: ['Could not find a date column in the CSV header'] };
  }

  const cell = (row: string[], i: number) => (i >= 0 ? (row[i] ?? '') : '');
  const transactions: BankTxn[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const row = splitCsvLine(lines[i]);
    if (row.length < 2) continue;
    const date = normalizeDate(cell(row, cols.date));
    if (!date) continue; // skip subtotal/footer rows without a real date

    const description = cell(row, cols.description);
    const reference = cell(row, cols.reference);
    let credit = numv(cell(row, cols.credit));
    let debit = numv(cell(row, cols.debit));

    // Single signed "amount" column fallback: positive = credit, negative = debit.
    if (!credit && !debit && cols.amount >= 0) {
      const amtRaw = cell(row, cols.amount);
      const amt = numv(amtRaw);
      if (/^-|\)/.test(amtRaw) || amt < 0) debit = Math.abs(amt); else credit = amt;
    }
    if (!credit && !debit) continue;
    const balance = cols.balance >= 0 ? numv(cell(row, cols.balance)) : null;
    transactions.push({ date, description, reference, debit: r2(debit), credit: r2(credit), balance });
  }
  if (!transactions.length) errors.push('No dated transactions with amounts were found');
  return { transactions, errors };
}

const HAY = (t: BankTxn) => (`${t.reference} ${t.description}`).toUpperCase().replace(/[^A-Z0-9]/g, '');

/**
 * Match statement credits to open invoices. Greedy 1:1 (a txn claims at most one
 * invoice and vice-versa). Signal strength: exact (invoice number in the txn text)
 * > high (credit ≈ outstanding) > medium (credit ≈ invoice total). Customer-name
 * presence is a tie-breaker.
 */
export function reconcile(txs: BankTxn[], invoices: InvoiceLite[]): ReconcileRow[] {
  const open = invoices.filter((inv) => inv.status !== 'draft' && r2((inv.totalAmount ?? 0) - (inv.paidAmount ?? 0)) > 0.01);
  const claimed = new Set<string>();
  const order: Confidence[] = ['exact', 'high', 'medium'];
  const rows: ReconcileRow[] = [];

  for (const txn of txs) {
    if (txn.credit <= 0.01) { rows.push({ txn, match: null }); continue; }
    const hay = HAY(txn);
    let best: TxnMatch | null = null;
    let bestRank = 99;
    let bestNameBonus = false;

    for (const inv of open) {
      if (claimed.has(inv.id)) continue;
      const total = r2(inv.totalAmount ?? 0);
      const paid = r2(inv.paidAmount ?? 0);
      const outstanding = r2(total - paid);
      const invNo = inv.invoiceNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const nameHit = !!inv.customerName && hay.includes(inv.customerName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));

      let confidence: Confidence | null = null;
      let reason = '';
      if (invNo && hay.includes(invNo)) { confidence = 'exact'; reason = `Invoice ${inv.invoiceNumber} referenced in the statement`; }
      else if (Math.abs(txn.credit - outstanding) <= 1) { confidence = 'high'; reason = `Amount matches outstanding ₹${outstanding.toFixed(2)}`; }
      else if (Math.abs(txn.credit - total) <= 1) { confidence = 'medium'; reason = `Amount matches invoice total ₹${total.toFixed(2)}`; }
      if (!confidence) continue;

      const rank = order.indexOf(confidence) * 10 - (nameHit ? 1 : 0);
      if (rank < bestRank || (rank === bestRank && nameHit && !bestNameBonus)) {
        bestRank = rank; bestNameBonus = nameHit;
        best = {
          invoiceId: inv.id, invoiceNumber: inv.invoiceNumber, customerName: inv.customerName,
          invoiceTotal: total, invoicePaid: paid, outstanding,
          allocAmount: r2(Math.min(txn.credit, outstanding)), confidence, reason,
        };
      }
    }
    if (best) claimed.add(best.invoiceId);
    rows.push({ txn, match: best });
  }
  return rows;
}
