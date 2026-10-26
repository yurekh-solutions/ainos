import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { deliverCampaign, parseRecipients } from '@/lib/campaign-email';

// Recipients can be stored as a single space/comma-joined string (legacy rows);
// always return them to the UI as a clean array of individual addresses so the
// count and chips are correct everywhere.
function withParsedRecipients<T extends { recipients: unknown }>(c: T) {
  const raw = Array.isArray(c.recipients) ? (c.recipients as Array<string | number>) : [];
  return { ...c, recipients: parseRecipients(raw) };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    // When an id is provided, return that single campaign (scoped to the company).
    const id = new URL(req.url).searchParams.get('id');
    if (id) {
      const campaign = await prisma.emailCampaign.findFirst({
        where: { id, companyId: user.companyId },
      });
      if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      return NextResponse.json(withParsedRecipients(campaign));
    }

    const campaigns = await prisma.emailCampaign.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(campaigns.map(withParsedRecipients));
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
    return NextResponse.json(withParsedRecipients(campaign), { status: 201 });
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

    // Send action: actually deliver via the shared sendEmail util (Brevo) and record the real outcome.
    if (action === 'send') {
      try {
        const result = await deliverCampaign(id);
        const updated = await prisma.emailCampaign.findUnique({ where: { id } });
        return NextResponse.json({ ...withParsedRecipients(updated ?? existing), send: result });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to send campaign';
        return NextResponse.json({ error: message }, { status: 502 });
      }
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
    return NextResponse.json(withParsedRecipients(updated));
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    // Only allow deleting a campaign that belongs to the caller's company.
    const existing = await prisma.emailCampaign.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    if (existing.companyId !== user.companyId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.emailCampaign.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
