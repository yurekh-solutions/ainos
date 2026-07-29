import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import Task from '@/models/Task';

// GET /api/tasks?projectId= — tasks of a project
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    if (!projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 });

    const owner = session.user.id || session.user.email;
    const project = await Project.findOne({ _id: projectId, createdBy: owner });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const tasks = await Task.find({ projectId }).sort({ order: 1, createdAt: 1 });
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/tasks — create a task in a project
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const body = await req.json();
    if (!body?.projectId || !body?.title) {
      return NextResponse.json({ error: 'projectId and title are required' }, { status: 400 });
    }

    const owner = session.user.id || session.user.email;
    const project = await Project.findOne({ _id: body.projectId, createdBy: owner });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const last = await Task.findOne({ projectId: body.projectId }).sort({ order: -1 });
    const task = await Task.create({
      projectId: body.projectId,
      title: body.title,
      description: body.description,
      status: body.status,
      priority: body.priority,
      assignee: body.assignee,
      dueDate: body.dueDate,
      order: (last?.order ?? -1) + 1,
      createdBy: owner,
    });
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
