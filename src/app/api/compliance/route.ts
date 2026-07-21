import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import ComplianceTask from '@/models/ComplianceTask';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const query: Record<string, unknown> = { createdBy: session.user.id || session.user.email };
    if (status) query.status = status;
    const tasks = await ComplianceTask.find(query).sort({ dueDate: 1 });
    const overdue = tasks.filter(t => t.status !== 'done' && new Date(t.dueDate) < new Date()).length;
    const upcoming = tasks.filter(t => t.status === 'upcoming').length;
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
    await connectDB();
    const body = await req.json();
    const task = await ComplianceTask.create({ ...body, createdBy: session.user.id || session.user.email });
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating compliance task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
