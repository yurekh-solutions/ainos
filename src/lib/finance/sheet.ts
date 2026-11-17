// Spreadsheet reading, shared by every importer.
//
// Invoices arrive as a Tally export and contacts as a list somebody has kept
// for years; both hit the same first problem, which is that the person who
// wrote the file chose the column headings. Folding a heading down to a
// comparison key, and deciding which spelling of a repeated heading wins, is
// therefore done once here instead of once per importer.

export type SheetRow = Record<string, unknown>;

/** "  GST % Of Value. " -> "gst % of value" — punctuation and spacing are the
 *  author's, not ours, so headings are folded before lookup. */
export function foldHeader(value: unknown): string {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9%/.]+/g, ' ').replace(/[/.]\s*$/, '').trim();
}

/** Canonical key -> every heading spelling worth recognising, folded into one map. */
export function buildHeaderLookup(aliases: Record<string, string[]>): Map<string, string> {
  const map = new Map<string, string>();
  for (const [canonical, spellings] of Object.entries(aliases)) {
    for (const alias of spellings) map.set(foldHeader(alias), canonical);
  }
  return map;
}

/** Rewrites one sheet row onto canonical keys. Unknown headings are dropped. */
export function mapHeaders(row: SheetRow, lookup: Map<string, string>): Partial<Record<string, unknown>> {
  const out: Partial<Record<string, unknown>> = {};
  for (const [rawKey, value] of Object.entries(row)) {
    const canonical = lookup.get(foldHeader(rawKey));
    if (!canonical) continue;
    if (value === undefined || value === null || String(value).trim() === '') continue;
    // First non-empty spelling wins: sheets repeat the heading block per line.
    if (out[canonical] === undefined) out[canonical] = value;
  }
  return out;
}

/** Trimmed text, or null when the cell holds nothing. A 0 is data, so it stays. */
export function cellText(value: unknown): string | null {
  const s = String(value ?? '').trim();
  return s ? s : null;
}
