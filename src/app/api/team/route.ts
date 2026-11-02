import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ALL_VERTICAL_KEYS } from '@/lib/verticals';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get the current user's company
    const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!currentUser?.companyId) return NextResponse.json([]);

    const members = await prisma.user.findMany({
      where: { companyId: currentUser.companyId },
      select: { id: true, name: true, email: true, role: true, isAdmin: true, phone: true, image: true, allowedVerticals: true, createdAt: true },
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

    const { userId, role, isAdmin, allowedVerticals } = await req.json();

    // Company owners and company admins manage their own team only
    const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    const isManager = !!currentUser && (currentUser.isAdmin || currentUser.role === 'owner');
    if (!isManager) return NextResponse.json({ error: 'Only company admins can manage team' }, { status: 403 });

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target || target.companyId !== currentUser!.companyId) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    // Vertical grants are validated against the registry; empty = inherit all
    const verticalsData = Array.isArray(allowedVerticals)
      ? allowedVerticals.filter((k: unknown) => typeof k === 'string' && ALL_VERTICAL_KEYS.includes(k))
      : undefined;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        role: role || undefined,
        isAdmin: isAdmin !== undefined ? isAdmin : undefined,
        allowedVerticals: verticalsData,
      },
      select: { id: true, name: true, email: true, role: true, isAdmin: true, allowedVerticals: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating team member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
