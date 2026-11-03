import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createOrder } from '@/lib/razorpay';
import {
  listToolOfferingsForCompany,
  createToolCheckout,
  type SelectionInput,
  type ToolEdition,
  type ToolCycle,
} from '@/lib/tool-subscriptions';

async function resolveCompanyId(req: NextRequest): Promise<{ email: string; companyId: string } | NextResponse> {
  const session = await getServerSession(req);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { companyId: true } });
  if (!user?.companyId) return NextResponse.json({ error: 'Complete onboarding before subscribing' }, { status: 400 });
  return { email: session.user.email, companyId: user.companyId };
}

// GET /api/billing/tools — à-la-carte catalog + this company's live tool subs.
export async function GET(req: NextRequest) {
  const ctx = await resolveCompanyId(req);
  if (ctx instanceof NextResponse) return ctx;
  try {
    const tools = await listToolOfferingsForCompany(ctx.companyId);
    return NextResponse.json({ tools });
  } catch (error) {
    console.error('Error listing tool subscriptions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/billing/tools — one consolidated checkout across selected tools.
// body: { selections: [{ key, edition, cycle }] } OR a single { key, edition, cycle }.
export async function POST(req: NextRequest) {
  const ctx = await resolveCompanyId(req);
  if (ctx instanceof NextResponse) return ctx;
  try {
    const body = await req.json();
    const raw: unknown[] = Array.isArray(body?.selections)
      ? body.selections
      : [body];

    const selections: SelectionInput[] = raw
      .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
      .map((x) => ({
        key: String(x.key ?? ''),
        edition: Number(x.edition ?? 2) as ToolEdition,
        cycle: (x.cycle === 'annual' ? 'annual' : 'monthly') as ToolCycle,
        seats: x.seats === undefined ? undefined : Number(x.seats),
      }))
      .filter((s) => s.key);

    if (selections.length === 0) {
      return NextResponse.json({ error: 'Select at least one tool' }, { status: 400 });
    }

    const intent = await createToolCheckout(ctx.companyId, selections, async (amountMinor, receipt) => {
      const order = await createOrder(amountMinor, receipt);
      return { id: order.id };
    });

    return NextResponse.json({ ok: true, companyId: ctx.companyId, ...intent });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error creating tool checkout:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
