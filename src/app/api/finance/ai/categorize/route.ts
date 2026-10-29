import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateAIText } from '@/lib/ai-provider';
import { extractJson, EXPENSE_CATEGORY_HINTS, nearestGstRate } from '@/lib/finance/ai';

// AI expense auto-categorisation: free text (title/vendor/description/receipt
// OCR) → a Chart-of-Accounts-friendly category + the likely GST rate.
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const text = String(body.text || '').trim();
    const amount = Number(body.amount);
    if (!text) return NextResponse.json({ error: 'Provide expense text to categorise' }, { status: 400 });

    const categoryList = EXPENSE_CATEGORY_HINTS.map(h => `${h.category}: ${h.when}`).join('\n');
    const system = 'You are an expert Indian bookkeeper. Classify a business expense and estimate its GST rate. Reply with ONLY minified JSON.';
    const user_prompt = `Expense details:\n${text}${Number.isFinite(amount) ? `\nAmount: ${amount} INR` : ''}

Choose exactly one category from this list:
${categoryList}

Return JSON: {"category": "<one category>", "gstRate": <one of 0,3,5,12,18,28>, "accountCode": "<4000 income or 5000 expense>", "confidence": <0-1>, "reason": "<short>"}`;

    const raw = await generateAIText(system, user_prompt, { json: true, timeoutMs: 20000 });
    const parsed = extractJson<Record<string, unknown>>(raw);

    const valid = new Set(EXPENSE_CATEGORY_HINTS.map(h => h.category));
    const category = parsed && typeof parsed.category === 'string' && valid.has(parsed.category)
      ? parsed.category
      : 'Other';

    return NextResponse.json({
      category,
      gstRate: nearestGstRate(parsed?.gstRate),
      accountCode: typeof parsed?.accountCode === 'string' ? parsed.accountCode : '5000',
      confidence: Number(parsed?.confidence) || 0.6,
      reason: typeof parsed?.reason === 'string' ? parsed.reason : 'AI suggestion',
    });
  } catch (error) {
    console.error('Expense categorise error:', error);
    const message = error instanceof Error ? error.message : 'Failed to categorise';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
