import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import GeneratedSite from '@/models/GeneratedSite';
import { generateSite } from '@/lib/site-generator';
import { checkQuota } from '@/lib/billing';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const userId = session.user.id || session.user.email;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (id) {
      const site = await GeneratedSite.findOne({ _id: id, createdBy: userId });
      if (!site) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(site);
    }
    const sites = await GeneratedSite.find({ createdBy: userId }).select('-html').sort({ createdAt: -1 });
    return NextResponse.json(sites);
  } catch (error) {
    console.error('Error fetching generated sites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const body = await req.json();
    if (!body.businessName || !body.industry) {
      return NextResponse.json({ error: 'businessName and industry are required' }, { status: 400 });
    }

    // Plan quota — free: 1 website/month, paid plans get more
    const quota = await checkQuota(session.user.id || session.user.email, 'website');
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.message, upgrade: true, plan: quota.plan, used: quota.used, limit: quota.limit }, { status: 402 });
    }
    const brief = {
      businessName: String(body.businessName).slice(0, 80),
      industry: String(body.industry).slice(0, 80),
      description: body.description ? String(body.description).slice(0, 600) : '',
      siteType: body.siteType || 'Website Development',
      theme: ['modern', 'minimal', 'bold'].includes(body.theme) ? body.theme : 'modern',
      primaryColor: /^#[0-9a-fA-F]{6}$/.test(body.primaryColor || '') ? body.primaryColor : '#6d5df6',
      email: body.email ? String(body.email).slice(0, 120) : '',
      phone: body.phone ? String(body.phone).slice(0, 30) : '',
      address: body.address ? String(body.address).slice(0, 200) : '',
    };
    const { html, aiUsed } = await generateSite(brief);
    const site = await GeneratedSite.create({
      businessName: brief.businessName,
      industry: brief.industry,
      description: brief.description,
      siteType: brief.siteType,
      theme: brief.theme,
      primaryColor: brief.primaryColor,
      html,
      createdBy: session.user.id || session.user.email,
    });
    return NextResponse.json({ _id: site._id, html, aiUsed }, { status: 201 });
  } catch (error) {
    console.error('Error generating site:', error);
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
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const userId = session.user.id || session.user.email;
    const deleted = await GeneratedSite.findOneAndDelete({ _id: id, createdBy: userId });
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting generated site:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
