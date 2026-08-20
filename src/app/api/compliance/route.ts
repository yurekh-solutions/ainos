import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const where: Record<string, unknown> = { companyId: user.companyId };
    if (status) where.status = status;

    const tasks = await prisma.complianceTask.findMany({
      where,
      orderBy: { dueDate: 'asc' }
    });

    const overdue = tasks.filter((t: any) => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < new Date()).length;
    const upcoming = tasks.filter((t: any) => t.status === 'upcoming').length;

    return NextResponse.json({ tasks, overdue, upcoming });
  } catch (error) {
    console.error('Error fetching compliance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const body = await req.json();
    const task = await prisma.complianceTask.create({
      data: { ...body, companyId: user.companyId }
    });
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating compliance task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
