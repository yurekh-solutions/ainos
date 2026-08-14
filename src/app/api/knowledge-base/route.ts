import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import KnowledgeArticle from '@/models/KnowledgeArticle';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    const articles = await KnowledgeArticle.find({ companyId: user.companyId }).sort({ createdAt: -1 });
    return NextResponse.json(articles);
  } catch (error) {
    console.error('Error fetching knowledge articles:', error);
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
    const article = await KnowledgeArticle.create({ ...body, companyId: user.companyId, author: user._id });
    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error('Error creating knowledge article:', error);
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
    const article = await KnowledgeArticle.findByIdAndUpdate(id, data, { new: true });
    return NextResponse.json(article);
  } catch (error) {
    console.error('Error updating knowledge article:', error);
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
    await KnowledgeArticle.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting knowledge article:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
