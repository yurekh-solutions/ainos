import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { runTool, TOOL_IDS, ToolId } from '@/lib/ai-tools';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    const output = await runTool(tool, inputs);
    return NextResponse.json(output);
  } catch (error) {
    console.error('Error running AI tool:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
