import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { ensureCompany } from '@/lib/prisma-helpers';
import { startBackgroundGeneration } from '@/lib/schedule-generator';

// POST /api/blog-agent/generate-all
// Kicks off server-side background generation of every pending scheduled blog
// for the company. Returns immediately — the server keeps writing blogs and
// they appear as published; the UI polls the list for progress.
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const company = await ensureCompany(session.user.email, session.user.name || 'User');
    if (!company) return NextResponse.json({ error: 'Failed to setup company' }, { status: 500 });

    const started = startBackgroundGeneration(company.id);
    return NextResponse.json({ started, alreadyRunning: !started });
  } catch (error) {
    console.error('Generate-all error:', error);
    return NextResponse.json({ error: 'Failed to start generation' }, { status: 500 });
  }
}
