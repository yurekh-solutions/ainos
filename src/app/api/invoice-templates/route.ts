import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await prisma.invoiceTemplate.findMany({
      where: { companyId: session.user.companyId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(templates);
  } catch (error: unknown) {
    console.error('GET /api/invoice-templates error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // If setting as default, unset other defaults first
    if (body.isDefault) {
      await prisma.invoiceTemplate.updateMany({
        where: { companyId: session.user.companyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const template = await prisma.invoiceTemplate.create({
      data: {
        name: body.name || 'Custom Template',
        isDefault: body.isDefault ?? true,
        primaryColor: body.primaryColor || '#6D28D9',
        secondaryColor: body.secondaryColor || '#8B5CF6',
        backgroundColor: body.backgroundColor || '#FFFFFF',
        textColor: body.textColor || '#1F2937',
        fontFamily: body.fontFamily || 'Helvetica',
        fontSize: body.fontSize || 'medium',
        layout: body.layout || 'standard',
        showLogo: body.showLogo ?? true,
        logoSize: body.logoSize || 'medium',
        logoPosition: body.logoPosition || 'left',
        showQrCode: body.showQrCode ?? false,
        showBankDetails: body.showBankDetails ?? true,
        showTerms: body.showTerms ?? true,
        terms: body.terms,
        notes: body.notes,
        headerText: body.headerText,
        footerText: body.footerText,
        accentWidth: body.accentWidth || 'thin',
        borderRadius: body.borderRadius || 'medium',
        companyId: session.user.companyId,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/invoice-templates error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    }

    // If setting as default, unset other defaults first
    if (data.isDefault) {
      await prisma.invoiceTemplate.updateMany({
        where: { companyId: session.user.companyId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const template = await prisma.invoiceTemplate.update({
      where: { id, companyId: session.user.companyId },
      data: {
        name: data.name,
        isDefault: data.isDefault,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        backgroundColor: data.backgroundColor,
        textColor: data.textColor,
        fontFamily: data.fontFamily,
        fontSize: data.fontSize,
        layout: data.layout,
        showLogo: data.showLogo,
        logoSize: data.logoSize,
        logoPosition: data.logoPosition,
        showQrCode: data.showQrCode,
        showBankDetails: data.showBankDetails,
        showTerms: data.showTerms,
        terms: data.terms,
        notes: data.notes,
        headerText: data.headerText,
        footerText: data.footerText,
        accentWidth: data.accentWidth,
        borderRadius: data.borderRadius,
      },
    });

    return NextResponse.json(template);
  } catch (error: unknown) {
    console.error('PUT /api/invoice-templates error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    }

    await prisma.invoiceTemplate.delete({
      where: { id, companyId: session.user.companyId },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('DELETE /api/invoice-templates error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
