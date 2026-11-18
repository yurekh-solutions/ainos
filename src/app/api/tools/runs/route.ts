import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Recent tool runs for the caller's company — powers the per-tool History tab
// and the "Recently used" strip on the Tools dashboard.
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { companyId: true },
    });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const limitRaw = Number(searchParams.get('limit'));
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 50) : 10;

    const runs = await prisma.toolRun.findMany({
      where: {
        companyId: user.companyId,
        ...(slug ? { tool: slug } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Flatten only what the UI shows — headline preview, status, time and cost
    // stay on the server; full outputs can be heavy (HTML sites, image lists).
    const items = runs.map(run => {
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

    return NextResponse.json({ runs: items });
  } catch (error) {
    console.error('Error fetching tool runs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
