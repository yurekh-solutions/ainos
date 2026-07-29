import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import Task from '@/models/Task';

// GET /api/projects/[id] — project with its tasks
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const owner = session.user.id || session.user.email;
    const project = await Project.findOne({ _id: id, createdBy: owner });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    const tasks = await Task.find({ projectId: id }).sort({ order: 1, createdAt: 1 });
    return NextResponse.json({ project, tasks });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/projects/[id] — update project fields
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const owner = session.user.id || session.user.email;
    const body = await req.json();
    const project = await Project.findOneAndUpdate(
      { _id: id, createdBy: owner },
      {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.dueDate !== undefined && { dueDate: body.dueDate }),
      },
      { new: true }
    );
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/projects/[id] — delete project and its tasks
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const owner = session.user.id || session.user.email;
    const project = await Project.findOneAndDelete({ _id: id, createdBy: owner });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    await Task.deleteMany({ projectId: id });
    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
