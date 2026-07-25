import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { runTool, TOOL_IDS, ToolId } from '@/lib/ai-tools';
import { checkQuota } from '@/lib/billing';
import connectDB from '@/lib/mongodb';
import ToolRun from '@/models/ToolRun';

// GET → list my deliverables (without full output), or ?id= for one full deliverable
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const userId = session.user.id || session.user.email;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (id) {
      const run = await ToolRun.findOne({ _id: id, createdBy: userId });
      if (!run) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(run);
    }
    const runs = await ToolRun.find({ createdBy: userId }).select('-output -inputs').sort({ createdAt: -1 }).limit(60);
    return NextResponse.json(runs);
  } catch (error) {
    console.error('Error fetching deliverables:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.user.id || session.user.email;
    const body = await req.json();
    const tool = body.tool as ToolId;
    if (!TOOL_IDS.includes(tool)) return NextResponse.json({ error: 'Unknown tool' }, { status: 400 });
    const inputs: Record<string, string> = {};
    for (const [k, v] of Object.entries(body.inputs || {})) {
      if (typeof v === 'string') inputs[k] = v.slice(0, 600);
    }
    if (!inputs.businessName && tool !== 'qr') {
      return NextResponse.json({ error: 'businessName is required' }, { status: 400 });
    }

    // Plan quota — free: 3 runs/month, paid plans get more
    const quota = await checkQuota(userId, 'toolRun');
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.message, upgrade: true, plan: quota.plan, used: quota.used, limit: quota.limit }, { status: 402 });
    }

    const output = await runTool(tool, inputs);

    // Save as a deliverable (also drives usage metering)
    try {
      await connectDB();
      await ToolRun.create({
        tool,
        serviceName: typeof body.serviceName === 'string' ? body.serviceName.slice(0, 120) : '',
        businessName: inputs.businessName || '',
        inputs,
        output,
        aiUsed: Boolean(output.aiUsed),
        createdBy: userId,
      });
    } catch (e) {
      console.error('Failed to save tool run:', e);
    }

    return NextResponse.json(output);
  } catch (error) {
    console.error('Error running AI tool:', error);
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
    const deleted = await ToolRun.findOneAndDelete({ _id: id, createdBy: userId });
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting deliverable:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
