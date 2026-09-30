import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const campaigns = await prisma.emailCampaign.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const body = await req.json();
    const campaign = await prisma.emailCampaign.create({
      data: {
        name: body.name,
        subject: body.subject,
        content: body.content,
        recipients: body.recipients || [],
        sentCount: body.sentCount || 0,
        status: body.status || 'draft',
        companyId: user.companyId,
      }
    });
    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    // Verify campaign belongs to user's company
    const existing = await prisma.emailCampaign.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    if (existing.companyId !== user.companyId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Send action: mark campaign as sent
    if (action === 'send') {
      const recipients = existing.recipients as string[] | null;
      const recipientCount = Array.isArray(recipients) ? recipients.length : 0;

      // In production, this would integrate with an SMTP service (SendGrid, SES, etc.)
      // For now, we simulate sending and mark as sent
      const updated = await prisma.emailCampaign.update({
        where: { id },
        data: {
          status: 'sent',
          sentAt: new Date(),
          sentCount: recipientCount,
        },
      });

      console.log(`[Email Campaign] Simulated sending ${recipientCount} emails for campaign: ${existing.name}`);
      // TODO: Integrate with real SMTP service when SMTP env vars are configured
      // if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      //   const transporter = nodemailer.createTransport({ ... });
      //   for (const email of recipients) { await transporter.sendMail({ ... }); }
      // }

      return NextResponse.json(updated);
    }

    // Default: update/edit campaign fields
    const body = await req.json();
    const updated = await prisma.emailCampaign.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        subject: body.subject ?? existing.subject,
        content: body.content ?? existing.content,
        recipients: body.recipients ?? existing.recipients,
        status: body.status ?? existing.status,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    await prisma.emailCampaign.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
