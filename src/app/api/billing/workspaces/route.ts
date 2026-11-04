import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createOrder } from '@/lib/razorpay';
import {
  listWorkspaceOfferingsForCompany,
  createWorkspaceCheckout,
  type WorkspaceSelectionInput,
  type WorkspaceCycle,
} from '@/lib/workspace-subscriptions';

async function resolveCompanyId(req: NextRequest): Promise<{ email: string; companyId: string } | NextResponse> {
  const session = await getServerSession(req);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { companyId: true } });
  if (!user?.companyId) return NextResponse.json({ error: 'Complete onboarding before subscribing' }, { status: 400 });
  return { email: session.user.email, companyId: user.companyId };
}

// GET /api/billing/workspaces — workspace catalog + this company's live subs.
export async function GET(req: NextRequest) {
  const ctx = await resolveCompanyId(req);
  if (ctx instanceof NextResponse) return ctx;
  try {
    const workspaces = await listWorkspaceOfferingsForCompany(ctx.companyId);
    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error('Error listing workspace subscriptions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/billing/workspaces — one consolidated checkout across selected workspaces.
// body: { selections: [{ key, cycle, seats }] } OR a single { key, cycle, seats }.
export async function POST(req: NextRequest) {
  const ctx = await resolveCompanyId(req);
  if (ctx instanceof NextResponse) return ctx;
  try {
    const body = await req.json();
    const raw: unknown[] = Array.isArray(body?.selections)
      ? body.selections
      : [body];

    const selections: WorkspaceSelectionInput[] = raw
      .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
      .map((x) => ({
        key: String(x.key ?? ''),
        cycle: (x.cycle === 'annual' ? 'annual' : 'monthly') as WorkspaceCycle,
        seats: x.seats === undefined ? undefined : Number(x.seats),
      }))
      .filter((s) => s.key);

    if (selections.length === 0) {
      return NextResponse.json({ error: 'Select at least one workspace' }, { status: 400 });
    }

    const intent = await createWorkspaceCheckout(ctx.companyId, selections, async (amountMinor, receipt) => {
      const order = await createOrder(amountMinor, receipt);
      return { id: order.id };
    });

    return NextResponse.json({ ok: true, companyId: ctx.companyId, ...intent });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error creating workspace checkout:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
