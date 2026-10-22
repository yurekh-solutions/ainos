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

    const requests = await prisma.serviceRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching service requests:', error);
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
    const request = await prisma.serviceRequest.create({
      data: {
        title: body.title || 'Service Request',
        description: body.description || null,
        category: body.category || body.type || null,
        priority: body.priority || 'medium',
        status: body.status || 'open',
        customerId: body.customerId || null,
        assignedTo: body.assignedTo || null,
        companyId: user.companyId,
      }
    });
    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    console.error('Error creating service request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
