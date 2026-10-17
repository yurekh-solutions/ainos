import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startTrial } from '@/lib/billing';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      // Auto-create user record if session exists but DB row is missing
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: (session.user.name || session.user.email.split('@')[0]) as string,
        },
      });
    }

    const body = await req.json();
    
    // Map frontend field names to schema field names
    const { panNumber, ...restBody } = body;
    const companyData = {
      ...restBody,
      taxId: panNumber || restBody.taxId,
      createdBy: user.id
    };
    
    const company = await prisma.company.create({
      data: companyData
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { companyId: company.id }
    });

    // Start 14-day AINOS One trial for new company
    try {
      await startTrial(company.id, user.id);
    } catch (e) {
      console.error('Failed to start trial:', e);
    }

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const company = await prisma.company.findUnique({ where: { id: user.companyId } });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    let companyId: string | null = null;
    let body: Record<string, unknown>;

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email } });
      companyId = user?.companyId || null;
      body = await req.json();
    } else {
      // Pre-approval fallback: the register flow attaches uploadedDocs before
      // any session exists, using the token issued at registration.
      const uploadToken = req.headers.get('x-upload-token');
      if (!uploadToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const tokenCompany = await prisma.company.findFirst({
        where: { uploadToken },
        select: { id: true },
      });
      if (!tokenCompany) {
        return NextResponse.json({ error: 'Invalid upload token' }, { status: 401 });
      }
      companyId = tokenCompany.id;
      // Token-authenticated callers may only attach uploadedDocs — nothing else.
      const rawBody = await req.json();
      body = { uploadedDocs: rawBody.uploadedDocs };
    }

    if (!companyId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const company = await prisma.company.update({
      where: { id: companyId },
      data: body
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
