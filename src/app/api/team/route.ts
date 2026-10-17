import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get the current user's company
    const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!currentUser?.companyId) return NextResponse.json([]);

    const members = await prisma.user.findMany({
      where: { companyId: currentUser.companyId },
      select: { id: true, name: true, email: true, role: true, isAdmin: true, phone: true, image: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { userId, role, isAdmin } = await req.json();

    // Verify the current user is admin
    const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!currentUser?.isAdmin) return NextResponse.json({ error: 'Only admins can manage team' }, { status: 403 });

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: role || undefined, isAdmin: isAdmin !== undefined ? isAdmin : undefined },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating team member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
