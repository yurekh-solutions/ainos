import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCreditBalance } from '@/lib/credits';

// Tools dashboard header figures: credit balance, catalogue size, usage this
// month, how many distinct tools were used, and the latest runs.
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { companyId: true },
    });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const companyId = user.companyId;
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [creditBalance, activeTools, runsThisMonth, distinctTools, recentRuns] = await Promise.all([
      getCreditBalance(companyId),
      prisma.tool.count({ where: { isActive: true } }),
      prisma.toolRun.count({ where: { companyId, createdAt: { gte: monthStart } } }),
      prisma.toolRun.findMany({
        where: { companyId, tool: { not: null } },
        distinct: ['tool'],
        select: { tool: true },
      }),
      prisma.toolRun.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
    ]);

    const recent = recentRuns.map(run => {
      const output = (run.output || {}) as Record<string, unknown>;
      const headline =
        typeof output.headline === 'string' ? output.headline :
        typeof output.title === 'string' ? String(output.title) :
        typeof output.invoiceNumber === 'string' ? `Invoice ${String(output.invoiceNumber)}` :
        null;
      const input = (run.inputs || run.input || {}) as Record<string, unknown>;
      const inputHint =
        typeof input.businessName === 'string' ? input.businessName :
        typeof input.topic === 'string' ? String(input.topic) :
        typeof input.subject === 'string' ? String(input.subject) :
        typeof input.qrData === 'string' ? String(input.qrData) :
        null;
      return {
        id: run.id,
        tool: run.tool,
        toolName: run.toolName,
        status: run.status,
        createdAt: run.createdAt,
        headline,
        inputHint,
      };
    });

    return NextResponse.json({
      creditBalance,
      activeTools,
      runsThisMonth,
      toolsUsed: distinctTools.filter(r => r.tool).length,
      recent,
    });
  } catch (error) {
    console.error('Error fetching tools overview:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
