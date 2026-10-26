import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/tools/audience — how many CRM customers have a valid email address.
// Powers the "→ N customers" chip on the Email Campaign screen so users see the
// recipient count BEFORE sending, instead of discovering it in the result.
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(_req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { companyId: true },
    });
    if (!user?.companyId) {
      return NextResponse.json({ recipients: 0, sample: [] });
    }

    const customers = await prisma.customer.findMany({
      where: { companyId: user.companyId, email: { not: null } },
      select: { email: true },
    });
    const emails = customers
      .map(c => c.email)
      .filter((e): e is string => !!e && /\S+@\S+\.\S+/.test(e));

    return NextResponse.json({
      recipients: emails.length,
      sample: emails.slice(0, 3),
      emails,
    });
  } catch (error) {
    console.error('Error fetching audience:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
