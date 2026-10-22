import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 403 });

    const websites = await prisma.website.findMany({
      where: { companyId: user.companyId },
      include: { _count: { select: { pages: true, forms: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(websites);
  } catch (e) {
    console.error('GET /api/websites error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 403 });

    const body = await req.json();
    const subdomain = `ainos-${Date.now().toString(36)}`;
    const website = await prisma.website.create({
      data: {
        name: body.name,
        description: body.description || '',
        subdomain,
        status: 'draft',
        template: body.template || 'default',
        config: body.config || {},
        companyId: user.companyId,
      },
    });
    // Create default home page
    await prisma.webPage.create({
      data: {
        title: 'Home',
        slug: 'home',
        isHome: true,
        status: 'draft',
        content: [{ type: 'hero', props: { title: body.name, subtitle: 'Welcome to our website' } }],
        websiteId: website.id,
        companyId: user.companyId,
      },
    });
    return NextResponse.json(website, { status: 201 });
  } catch (e) {
    console.error('POST /api/websites error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const body = await req.json();
    const website = await prisma.website.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.domain !== undefined && { domain: body.domain }),
        ...(body.status && { status: body.status }),
        ...(body.template && { template: body.template }),
        ...(body.config && { config: body.config }),
        ...(body.logoUrl !== undefined && { logoUrl: body.logoUrl }),
        ...(body.seoTitle !== undefined && { seoTitle: body.seoTitle }),
        ...(body.seoDesc !== undefined && { seoDesc: body.seoDesc }),
        ...(body.customCode !== undefined && { customCode: body.customCode }),
      },
    });
    return NextResponse.json(website);
  } catch (e) {
    console.error('PUT /api/websites error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    await prisma.webPage.deleteMany({ where: { websiteId: id } });
    await prisma.webForm.deleteMany({ where: { websiteId: id } });
    await prisma.webMenu.deleteMany({ where: { websiteId: id } });
    await prisma.website.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/websites error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
