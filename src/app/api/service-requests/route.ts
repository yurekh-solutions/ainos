import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import ServiceRequest from '@/models/ServiceRequest';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const query: Record<string, unknown> = { createdBy: session.user.id || session.user.email };
    if (status) query.status = status;
    const requests = await ServiceRequest.find(query).sort({ createdAt: -1 });
    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching service requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const body = await req.json();
    if (!body.serviceName || !body.category) {
      return NextResponse.json({ error: 'serviceName and category are required' }, { status: 400 });
    }
    const request = await ServiceRequest.create({ ...body, createdBy: session.user.id || session.user.email });
    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    console.error('Error creating service request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
