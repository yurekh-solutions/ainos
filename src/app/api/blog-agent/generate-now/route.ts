import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { generateScheduleNow } from '@/lib/schedule-generator';

// POST /api/blog-agent/generate-now  { scheduleId }
// On-demand generation: writes the full article + featured image for a
// scheduled blog RIGHT NOW instead of waiting for the scheduled date.
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { scheduleId } = (await req.json()) as { scheduleId?: string };
    if (!scheduleId) return NextResponse.json({ error: 'Missing scheduleId' }, { status: 400 });

    const result = await generateScheduleNow(scheduleId);
    if (result.status !== 'published') {
      return NextResponse.json({ error: result.reason || 'Generation failed — please try again' }, { status: 502 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Generate-now error:', error);
    return NextResponse.json({ error: 'Failed to generate blog' }, { status: 500 });
  }
}
