import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { searchParams } = new URL(req.url);
    const employee = searchParams.get('employee');
    const month = searchParams.get('month');
    const query: Record<string, unknown> = { createdBy: session.user.id || session.user.email };
    if (employee) query.employee = employee;
    if (month) {
      const [year, m] = month.split('-');
      query.date = { $gte: new Date(Number(year), Number(m) - 1, 1), $lt: new Date(Number(year), Number(m), 1) };
    }
    const attendance = await Attendance.find(query).sort({ date: -1 });
    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const body = await req.json();
    const record = await Attendance.create({ ...body, createdBy: session.user.id || session.user.email });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
