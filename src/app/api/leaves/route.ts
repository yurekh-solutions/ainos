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

    const leaves = await prisma.leaveRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(leaves);
  } catch (error) {
    console.error('Error fetching leaves:', error);
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
    const emp = body.employee ? await prisma.employee.findUnique({ where: { id: body.employee } }) : null;
    const leave = await prisma.leaveRequest.create({
      data: {
        employeeId: emp?.id || body.employeeId || null,
        employeeName: body.employeeName || emp?.name || body.employee || null,
        leaveType: body.leaveType || 'casual',
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        endDate: body.endDate ? new Date(body.endDate) : new Date(),
        reason: body.reason || null,
        status: body.status || 'pending',
        companyId: user.companyId,
      }
    });
    return NextResponse.json(leave, { status: 201 });
  } catch (error) {
    console.error('Error creating leave:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
