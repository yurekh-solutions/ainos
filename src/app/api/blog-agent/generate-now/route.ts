import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { generateScheduleNow } from '@/lib/schedule-generator';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';

// POST /api/blog-agent/generate-now  { scheduleId }
// On-demand generation: writes the full article + featured image for a
// scheduled blog now. It still goes live on its scheduled date.
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { scheduleId } = (await req.json()) as { scheduleId?: string };
    if (!scheduleId) return NextResponse.json({ error: 'Missing scheduleId' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { companyId: true } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    const owned = await prisma.blogSchedule.findFirst({
      where: { id: scheduleId, ...(isAdmin(session.user.email) ? {} : { companyId: user.companyId }) },
      select: { id: true },
    });
    if (!owned) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    const result = await generateScheduleNow(owned.id, { force: true });
    if (result.status !== 'published') {
      return NextResponse.json({ error: result.reason || 'Generation failed — please try again' }, { status: 502 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Generate-now error:', error);
    return NextResponse.json({ error: 'Failed to generate blog' }, { status: 500 });
  }
}
