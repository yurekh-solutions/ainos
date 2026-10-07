import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - List all accounts
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 401 });

    const accounts = await prisma.account.findMany({
      where: { companyId: user.companyId },
      include: { children: true, parent: true },
      orderBy: { code: 'asc' },
    });

    return NextResponse.json(accounts);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

// POST - Create account
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 401 });

    const body = await req.json();
    const { code, name, type, parentId, description } = body;

    if (!code || !name || !type) {
      return NextResponse.json({ error: 'Code, name and type are required' }, { status: 400 });
    }

    const account = await prisma.account.create({
      data: {
        code,
        name,
        type,
        parentId: parentId || null,
        description: description || null,
        companyId: user.companyId,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}

// PUT - Update account
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 401 });

    const body = await req.json();
    const { id, ...data } = body;

    if (!id) return NextResponse.json({ error: 'Account ID required' }, { status: 400 });

    const account = await prisma.account.update({
      where: { id, companyId: user.companyId },
      data,
    });

    return NextResponse.json(account);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
  }
}

// DELETE - Delete account
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Account ID required' }, { status: 400 });

    await prisma.account.delete({ where: { id, companyId: user.companyId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
