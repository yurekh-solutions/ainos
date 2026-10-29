// Small helpers shared by the AI finance endpoints. The vision/text providers
// sometimes wrap JSON in code fences or add prose, so we parse defensively.

export function extractJson<T = Record<string, unknown>>(raw: string): T | null {
  if (!raw) return null;
  const cleaned = raw.replace(/```(?:json)?/gi, '').trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const match = cleaned.match(/[[{][\s\S]*[\]}]/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        return null;
      }
    }
  }
  return null;
}

// Expense categories mirror the ones the Expenses UI offers, so a suggestion
// always maps to something the user can actually save.
export const EXPENSE_CATEGORY_HINTS: { category: string; when: string }[] = [
  { category: 'Travel', when: 'flights, trains, cabs, hotel, trip' },
  { category: 'Food', when: 'meals, restaurants, catering, groceries for team' },
  { category: 'Office Supplies', when: 'stationery, consumables, small equipment' },
  { category: 'Software', when: 'SaaS, subscriptions, licences, cloud hosting' },
  { category: 'Marketing', when: 'ads, campaigns, promos, sponsorships' },
  { category: 'Utilities', when: 'electricity, water, internet, phone, gas' },
  { category: 'Rent', when: 'office / premises rent, lease' },
  { category: 'Salary', when: 'payroll, wages, contractor pay' },
  { category: 'Maintenance', when: 'repairs, servicing, AMC' },
  { category: 'Transport', when: 'freight, logistics, delivery, fuel' },
  { category: 'Professional Fees', when: 'legal, CA / audit, consultancy' },
  { category: 'Other', when: 'anything not clearly matching above' },
];

// Common Indian GST rate bands to snap the model onto valid slugs.
export const GST_RATES = [0, 3, 5, 12, 18, 28];

export function nearestGstRate(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 18;
  return GST_RATES.reduce((best, r) => (Math.abs(r - n) < Math.abs(best - n) ? r : best), 18);
}
