import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cancelWorkspaceSubscription } from '@/lib/workspace-subscriptions';

/**
 * POST /api/billing/workspaces/cancel — body { key }.
 * Stops renewal but keeps access until the paid period ends (no surprise wipe).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { key } = await req.json();
    if (!key || typeof key !== 'string') return NextResponse.json({ error: 'Workspace key required' }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { companyId: true },
    });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    await cancelWorkspaceSubscription(user.companyId, key);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling workspace subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
