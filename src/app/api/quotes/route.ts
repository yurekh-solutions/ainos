import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Quote from '@/models/Quote';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    const quotes = await Quote.find({ companyId: user.companyId }).sort({ createdAt: -1 });
    return NextResponse.json(quotes);
  } catch (error) {
    console.error('Error fetching quotes:', error);
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
    const quote = await Quote.create({ ...body, companyId: user.companyId, createdBy: user._id });
    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    console.error('Error creating quote:', error);
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
    const quote = await Quote.findByIdAndUpdate(id, data, { new: true });
    return NextResponse.json(quote);
  } catch (error) {
    console.error('Error updating quote:', error);
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
    await Quote.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting quote:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
