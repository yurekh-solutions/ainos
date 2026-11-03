import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertToolCredits } from '@/lib/tool-charge';
import { submitJob } from '@/lib/job-queue';
// Import for side effect: registers the 'blog_generate' job handler so the
// detached job runs in this same web process.
import '@/lib/blog-generate-job';

// POST /api/blog-posts/generate — AI Blog Agent (SEO/AEO posts + featured image).
//
// The heavy generation (generateAIText up to 180s + multi-provider image check)
// is handed to the async job queue so this request returns a jobId in <2s and the
// client polls /api/jobs/[id] — eliminating the 55s gateway 502. Auth, validation
// and credit-affordability stay inline so 401/400/402 remain instant, and credits
// are charged only on success inside the handler.
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { topic, keywords, tone, length, industry, language, idempotencyKey } = await req.json();
    if (typeof topic !== 'string' || !topic.trim()) return NextResponse.json({ error: 'Topic is required' }, { status: 400 });

    const account = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { companyId: true },
    });
    const companyId = account?.companyId ?? null;
    const affordable = await assertToolCredits(companyId, 'ai-blog-generate');
    if (!affordable.ok) {
      return NextResponse.json(
        { error: affordable.error, creditsRequired: affordable.cost, balance: affordable.balance },
        { status: 402 }
      );
    }

    const { jobId, status } = await submitJob(
      'blog_generate',
      {
        companyId,
        topic: topic.trim(),
        keywords: typeof keywords === 'string' ? keywords : undefined,
        tone: typeof tone === 'string' ? tone : undefined,
        length: typeof length === 'string' ? length : undefined,
        industry: typeof industry === 'string' ? industry : undefined,
        language: typeof language === 'string' ? language : undefined,
      },
      {
        companyId: companyId ?? undefined,
        // A replayed submit (double-click / retry) returns the same job instead
        // of generating (and charging) twice.
        idempotencyKey: typeof idempotencyKey === 'string' ? idempotencyKey : undefined,
      },
    );

    return NextResponse.json({ pending: true, jobId, status });
  } catch (error) {
    console.error('Error starting blog generation:', error);
    return NextResponse.json({ error: 'Could not start generation. Please try again.' }, { status: 500 });
  }
}
