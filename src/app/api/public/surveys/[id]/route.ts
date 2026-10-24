import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rateLimit';
import { normalizeAnswers } from '@/lib/surveys';
import { recordAudit } from '@/lib/audit';

/** Public link: no session, so the only protection is the rate limit and the id. */
const MAX_SUBMISSIONS_PER_MINUTE = 20;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const survey = await prisma.survey.findFirst({
      where: { id, status: 'live' },
      select: {
        id: true,
        title: true,
        description: true,
        audience: true,
        questions: {
          orderBy: { position: 'asc' },
          select: { id: true, prompt: true, kind: true, options: true, required: true },
        },
      },
    });

    if (!survey) return NextResponse.json({ error: 'This survey is not available' }, { status: 404 });
    return NextResponse.json({ survey });
  } catch (error) {
    console.error('Public survey GET failed', error);
    return NextResponse.json({ error: 'This survey is not available' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limit = await rateLimit(req, { maxRequests: MAX_SUBMISSIONS_PER_MINUTE, windowMs: 60_000 });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many submissions, please try again in a minute' }, { status: 429 });
  }

  const { id } = await params;

  try {
    const body = await req.json().catch(() => ({}));

    const survey = await prisma.survey.findFirst({
      where: { id, status: 'live' },
      include: { questions: { orderBy: { position: 'asc' } } },
    });
    if (!survey) return NextResponse.json({ error: 'This survey is not available' }, { status: 404 });

    const normalized = normalizeAnswers(survey.questions, body.answers);
    if (!normalized.ok) return NextResponse.json({ error: normalized.error }, { status: 400 });

    const response = await prisma.surveyResponse.create({
      data: {
        surveyId: id,
        respondentName: body.respondentName ? String(body.respondentName).trim().slice(0, 120) : null,
        answers: normalized.answers as unknown as Prisma.InputJsonValue,
        score: normalized.score,
      },
    });

    if (survey.companyId) {
      await recordAudit({
        companyId: survey.companyId,
        entity: 'survey',
        entityId: id,
        action: 'response_received',
        actor: { email: 'public-link' },
        summary: `Public response from ${response.respondentName || 'anonymous'}`,
      });
    }

    return NextResponse.json({ success: true, score: response.score }, { status: 201 });
  } catch (error) {
    console.error('Public survey POST failed', error);
    return NextResponse.json({ error: 'Could not submit this response' }, { status: 500 });
  }
}
