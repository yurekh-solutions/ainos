import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getJob } from '@/lib/job-queue';

// GET /api/jobs/[id] — poll an async job's status + result (owner-scoped).
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(req);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const job = await getJob(id);
  if (!job) return NextResponse.json({ error: 'Job not found or expired' }, { status: 404 });

  // Ownership: a job is only readable by its company (and legacy jobs without
  // a companyId are treated as public-by-id, since the id is unguessable).
  if (job.companyId) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { companyId: true },
    });
    if (user?.companyId !== job.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  return NextResponse.json({ job });
}
