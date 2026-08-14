import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Timesheet from '@/models/Timesheet';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    const timesheets = await Timesheet.find({ companyId: user.companyId }).sort({ date: -1 });
    return NextResponse.json(timesheets);
  } catch (error) {
    console.error('Error fetching timesheets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    const body = await req.json();
    const timesheet = await Timesheet.create({ ...body, companyId: user.companyId });
    return NextResponse.json(timesheet, { status: 201 });
  } catch (error) {
    console.error('Error creating timesheet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const body = await req.json();
    const { id, ...data } = body;
    const timesheet = await Timesheet.findByIdAndUpdate(id, data, { new: true });
    return NextResponse.json(timesheet);
  } catch (error) {
    console.error('Error updating timesheet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    await Timesheet.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting timesheet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
