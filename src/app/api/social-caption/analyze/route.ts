import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertToolCredits } from '@/lib/tool-charge';
import { submitJob } from '@/lib/job-queue';
// Import for side effect: registers the 'social_caption_analyze' job handler so
// the detached scan runs in this same web process.
import '@/lib/social-caption-analyze-job';

// POST /api/social-caption/analyze — AI Media Scanner (auto-fills topic + description).
//
// The vision call can exceed the ~55s gateway ceiling, so this route validates and
// checks credit-affordability inline (401/400/402 stay instant) and hands the slow
// scan to the async job queue, returning { pending, jobId } for the client to poll.
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { imageBase64, mediaType, idempotencyKey } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: 'Media is required' }, { status: 400 });
    }

    const account = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { companyId: true },
    });
    const companyId = account?.companyId ?? null;
    const affordable = await assertToolCredits(companyId, 'social-caption-analyze');
    if (!affordable.ok) {
      return NextResponse.json(
        { error: affordable.error, creditsRequired: affordable.cost, balance: affordable.balance },
        { status: 402 }
      );
    }

    const { jobId, status } = await submitJob(
      'social_caption_analyze',
      {
        companyId,
        imageBase64,
        mediaType: typeof mediaType === 'string' ? mediaType : undefined,
      },
      {
        companyId: companyId ?? undefined,
        idempotencyKey: typeof idempotencyKey === 'string' ? idempotencyKey : undefined,
      },
    );

    return NextResponse.json({ pending: true, jobId, status });
  } catch (error) {
    console.error('Media analyze error:', error);
    return NextResponse.json({ error: 'Could not start the scan. Please try again.' }, { status: 500 });
  }
}
