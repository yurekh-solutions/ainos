import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AUTOMATION_TEMPLATES, triggerEvent } from '@/lib/automation-engine';

// GET /api/automations - List all automations
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const automations = await prisma.automation.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(automations);
  } catch (error) {
    console.error('Error fetching automations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/automations - Create automation
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const body = await req.json();

    // Check if creating from template
    if (body.templateId) {
      const template = AUTOMATION_TEMPLATES.find(t => t.id === body.templateId);
      if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

      const { id: _tid, ...templateData } = template;
      const automation = await prisma.automation.create({
        data: {
          name: templateData.name,
          description: templateData.description,
          trigger: JSON.stringify(templateData.trigger),
          actions: templateData.actions as any,
          companyId: user.companyId,
          createdBy: user.id,
          status: body.enabled !== false ? 'active' : 'inactive',
        }
      });
      return NextResponse.json(automation, { status: 201 });
    }

    // Serialize trigger if it's an object
    const triggerStr = body.trigger && typeof body.trigger === 'object'
      ? JSON.stringify(body.trigger)
      : body.trigger;
    const automation = await prisma.automation.create({
      data: {
        name: body.name,
        description: body.description,
        trigger: triggerStr,
        actions: body.actions,
        companyId: user.companyId,
        createdBy: user.id,
        status: body.status || 'active',
      }
    });
    return NextResponse.json(automation, { status: 201 });
  } catch (error) {
    console.error('Error creating automation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/automations - Update automation (id in body)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const automation = await prisma.automation.update({ where: { id }, data });
    return NextResponse.json(automation);
  } catch (error) {
    console.error('Error updating automation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/automations - Delete automation (id in query)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await prisma.automation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting automation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
