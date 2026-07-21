import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Automation from '@/models/Automation';
import { AUTOMATION_TEMPLATES, triggerEvent } from '@/lib/automation-engine';

// GET /api/automations - List all automations
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const moduleName = searchParams.get('module');

    const query: Record<string, unknown> = { createdBy: session.user.id || session.user.email };
    if (moduleName) query.module = moduleName;

    const automations = await Automation.find(query).sort({ createdAt: -1 });
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

    await connectDB();
    const body = await req.json();

    // Check if creating from template
    if (body.templateId) {
      const template = AUTOMATION_TEMPLATES.find(t => t.id === body.templateId);
      if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

      const automation = await Automation.create({
        ...template,
        createdBy: session.user.id || session.user.email,
        enabled: body.enabled !== false,
      });
      return NextResponse.json(automation, { status: 201 });
    }

    const automation = await Automation.create({
      ...body,
      createdBy: session.user.id || session.user.email,
    });
    return NextResponse.json(automation, { status: 201 });
  } catch (error) {
    console.error('Error creating automation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/automations/:id - Update automation
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { pathname } = new URL(req.url);
    const id = pathname.split('/').pop();

    const body = await req.json();
    const automation = await Automation.findOneAndUpdate(
      { _id: id, createdBy: session.user.id || session.user.email },
      { $set: body },
      { new: true }
    );

    if (!automation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(automation);
  } catch (error) {
    console.error('Error updating automation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/automations/:id - Delete automation
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { pathname } = new URL(req.url);
    const id = pathname.split('/').pop();

    const result = await Automation.findOneAndDelete({
      _id: id,
      createdBy: session.user.id || session.user.email,
    });

    if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting automation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/automations/trigger - Manually trigger an event
export async function POST_TRIGGER(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { event, data } = body;

    if (!event) return NextResponse.json({ error: 'Event is required' }, { status: 400 });

    await triggerEvent(event, session.user.id || session.user.email, data);
    return NextResponse.json({ success: true, message: `Event "${event}" triggered` });
  } catch (error) {
    console.error('Error triggering event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/automations/templates - Get available templates
export async function GET_TEMPLATES(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const moduleName = searchParams.get('module');

    let templates = AUTOMATION_TEMPLATES;
    if (moduleName) templates = templates.filter(t => t.module === moduleName);

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
