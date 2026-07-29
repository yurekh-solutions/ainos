import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import Task from '@/models/Task';

// GET /api/projects — list projects with task completion stats
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const owner = session.user.id || session.user.email;
    const projects = await Project.find({ createdBy: owner }).sort({ createdAt: -1 }).lean();

    const projectIds = projects.map((p) => String(p._id));
    const taskCounts = await Task.aggregate([
      { $match: { projectId: { $in: projectIds } } },
      { $group: { _id: { projectId: '$projectId', status: '$status' }, count: { $sum: 1 } } },
    ]);
    const countsByProject: Record<string, { total: number; done: number }> = {};
    for (const row of taskCounts) {
      const pid = row._id.projectId;
      countsByProject[pid] = countsByProject[pid] || { total: 0, done: 0 };
      countsByProject[pid].total += row.count;
      if (row._id.status === 'done') countsByProject[pid].done += row.count;
    }

    const withStats = projects.map((p) => ({
      ...p,
      taskCount: countsByProject[String(p._id)]?.total || 0,
      doneCount: countsByProject[String(p._id)]?.done || 0,
    }));

    const stats = {
      total: projects.length,
      byStatus: projects.reduce((acc: Record<string, number>, p) => {
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
    await connectDB();
    const body = await req.json();
    if (!body?.name) return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    const project = await Project.create({
      name: body.name,
      description: body.description,
      status: body.status,
      color: body.color,
      dueDate: body.dueDate,
      createdBy: session.user.id || session.user.email,
    });
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
