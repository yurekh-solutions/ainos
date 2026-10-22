import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const websiteId = searchParams.get('websiteId');

    const where: Record<string, string> = { companyId: user.companyId };
    if (websiteId) where.websiteId = websiteId;

    const pages = await prisma.webPage.findMany({ where, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(pages);
  } catch (e) {
    console.error('GET /api/websites/pages error:', e);
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
    const page = await prisma.webPage.create({
      data: {
        title: body.title,
        slug: body.slug || body.title.toLowerCase().replace(/\s+/g, '-'),
        content: body.content || [],
        status: body.status || 'draft',
        isHome: body.isHome || false,
        seoTitle: body.seoTitle,
        seoDesc: body.seoDesc,
        websiteId: body.websiteId,
        companyId: user.companyId,
      },
    });
    return NextResponse.json(page, { status: 201 });
  } catch (e) {
    console.error('POST /api/websites/pages error:', e);
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
    const page = await prisma.webPage.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.slug && { slug: body.slug }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.status && { status: body.status }),
        ...(body.isHome !== undefined && { isHome: body.isHome }),
        ...(body.seoTitle !== undefined && { seoTitle: body.seoTitle }),
        ...(body.seoDesc !== undefined && { seoDesc: body.seoDesc }),
      },
    });
    return NextResponse.json(page);
  } catch (e) {
    console.error('PUT /api/websites/pages error:', e);
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

    await prisma.webPage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/websites/pages error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
