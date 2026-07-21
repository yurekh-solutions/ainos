import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import LeaveRequest from '@/models/LeaveRequest';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const employee = searchParams.get('employee');
    const query: Record<string, unknown> = { createdBy: session.user.id || session.user.email };
    if (status) query.status = status;
    if (employee) query.employee = employee;
    const leaves = await LeaveRequest.find(query).sort({ createdAt: -1 });
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
    await connectDB();
    const body = await req.json();
    const leave = await LeaveRequest.create({ ...body, createdBy: session.user.id || session.user.email });
    return NextResponse.json(leave, { status: 201 });
  } catch (error) {
    console.error('Error creating leave:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
