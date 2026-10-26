import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAllTools, getToolBySlug } from '@/lib/tool-runner';
import { isAdmin } from '@/lib/admin';
import { summarizeAccess, levelForSlug, isMarketingSlug, type AccessSummary } from '@/lib/tool-guard';

// Annotate each tool with whether the caller's company can actually run it,
// so the marketplace can show 🔒 + an upgrade CTA instead of letting users
// hit a 402 at run time. Locked tools stay listed for discovery.
function withAccess<T extends { slug: string; category: string | null }>(
  tools: T[],
  summary: AccessSummary | null
) {
  return tools.map((tool) => {
    const level = summary ? levelForSlug(tool.slug, summary) : 2;
    return {
      ...tool,
      level,
      accessible: level > 0,
      requiredPlan: isMarketingSlug(tool.slug) ? 'marketing' : undefined,
    };
  });
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // This session helper only exposes email; resolve the company from the user row.
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { companyId: true },
    });
    const companyId = user?.companyId ?? null;
    const summary = await summarizeAccess(companyId, session.user.email);

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const slug = searchParams.get('slug');

    if (slug) {
      const tool = await getToolBySlug(slug);
      if (!tool) return NextResponse.json(tool);
      const [annotated] = withAccess([tool as { slug: string; category: string | null }], summary);
      return NextResponse.json(annotated);
    }

    if (category) {
      const tools = await prisma.tool.findMany({
        where: { isActive: true, category },
        orderBy: { name: 'asc' }
      });
      return NextResponse.json(withAccess(tools, summary));
    }

    const tools = await getAllTools();
    return NextResponse.json(withAccess(tools, summary));
  } catch (error) {
    console.error('Error fetching tools:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Catalogue changes belong to platform admins only; regular users can run
    // tools but never publish them.
    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const name = String(body?.name || '').trim();
    const slug = String(body?.slug || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const existing = await prisma.tool.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: `Slug "${slug}" is already in use` }, { status: 409 });
    }

    const creditCost = Number(body?.creditCost);
    const tool = await prisma.tool.create({
      data: {
        name,
        slug,
        description: body?.description ? String(body.description) : null,
        category: body?.category ? String(body.category).toLowerCase() : null,
        creditCost: Number.isFinite(creditCost) && creditCost >= 0 ? Math.floor(creditCost) : 1,
        isActive: body?.isActive !== false,
        iconUrl: body?.iconUrl ? String(body.iconUrl) : null,
        handlerCode: body?.handlerCode ? String(body.handlerCode) : null,
      },
    });
    return NextResponse.json(tool, { status: 201 });
  } catch (error) {
    console.error('Error creating tool:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
