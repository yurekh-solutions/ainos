import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    const notifications = await Notification.find({ userId: user._id }).sort({ createdAt: -1 }).limit(50);
    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
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
    const notification = await Notification.create({ ...body, companyId: user.companyId, userId: user._id });
    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
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
    const notification = await Notification.findByIdAndUpdate(id, data, { new: true });
    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const body = await req.json();
    const { id } = body;
    await Notification.findByIdAndUpdate(id, { read: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
