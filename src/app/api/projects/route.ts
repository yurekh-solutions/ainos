import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/projects — list projects with task completion stats
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    const where = user?.companyId ? { companyId: user.companyId } : {};

    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    // Get task counts per project
    const projectIds = projects.map(p => p.id);
    const tasks = await prisma.task.findMany({
      where: { projectId: { in: projectIds } },
      select: { projectId: true, status: true }
    });

    const countsByProject: Record<string, { total: number; done: number }> = {};
    for (const task of tasks) {
      const pid = task.projectId || 'unknown';
      countsByProject[pid] = countsByProject[pid] || { total: 0, done: 0 };
      countsByProject[pid].total += 1;
      if (task.status === 'done') countsByProject[pid].done += 1;
    }

    const withStats = projects.map(p => ({
      ...p,
      taskCount: countsByProject[p.id]?.total || 0,
      doneCount: countsByProject[p.id]?.done || 0,
    }));

    const stats = {
      total: projects.length,
      byStatus: projects.reduce((acc: Record<string, number>, p: { status: string }) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {}),
    };

    return NextResponse.json({ projects: withStats, stats });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/projects — create a project
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    const body = await req.json();
    if (!body?.name) return NextResponse.json({ error: 'Project name is required' }, { status: 400 });

    const project = await prisma.project.create({
      data: {
        name: body.name,
        description: body.description,
        status: body.status || 'active',
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.dueDate ? new Date(body.dueDate) : null,
        budget: body.budget,
        managerId: session.user.id || session.user.email,
        companyId: user?.companyId || null,
      }
    });
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
