import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { executeTool } from '@/lib/tool-runner';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { toolSlug, input } = body;

    if (!toolSlug) {
      return NextResponse.json({ error: 'Tool slug is required' }, { status: 400 });
    }

    // Get user's company
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const result = await executeTool(user.companyId, user.id, toolSlug, input || {}, session.user.email);

    if (!result.success) {
      // Locked by subscription (402) vs out of credits (402) vs other errors (400).
      // Preserve the required-plan hints so the run screen can show the right CTA.
      const status = result.requiredPlan ? 402 : 400;
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          newBalance: result.newBalance,
          requiredTool: result.requiredTool,
          requiredPlan: result.requiredPlan,
        },
        { status }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error executing tool:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
