import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/permissions';
import { recordAudit } from '@/lib/audit';
import { normalizeAnswers } from '@/lib/surveys';

export async function GET(req: NextRequest) {
  const ctx = await requireSession(req);
  if (ctx.error) return ctx.error;

  const { searchParams } = new URL(req.url);
  const surveyId = searchParams.get('surveyId') || '';
  if (!surveyId) return NextResponse.json({ error: 'surveyId is required' }, { status: 400 });

  try {
    const survey = await prisma.survey.findFirst({ where: { id: surveyId, companyId: ctx.companyId }, select: { id: true } });
    if (!survey) return NextResponse.json({ error: 'Survey not found' }, { status: 404 });

    const responses = await prisma.surveyResponse.findMany({ where: { surveyId }, orderBy: { submittedAt: 'desc' }, take: 200 });
    return NextResponse.json({ responses, canManage: ctx.canManage });
  } catch (error) {
    console.error('Survey responses GET failed', error);
    return NextResponse.json({ error: 'Could not load responses' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ctx = await requireSession(req);
  if (ctx.error) return ctx.error;

  try {
    const body = await req.json();
    const surveyId = String(body.surveyId || '');
    if (!surveyId) return NextResponse.json({ error: 'surveyId is required' }, { status: 400 });

    const survey = await prisma.survey.findFirst({
      where: { id: surveyId, companyId: ctx.companyId },
      include: { questions: { orderBy: { position: 'asc' } } },
    });
    if (!survey) return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    if (survey.status !== 'live') return NextResponse.json({ error: 'This survey is not accepting responses' }, { status: 400 });

    const normalized = normalizeAnswers(survey.questions, body.answers);
    if (!normalized.ok) return NextResponse.json({ error: normalized.error }, { status: 400 });

    const response = await prisma.surveyResponse.create({
      data: {
        surveyId,
        respondentName: body.respondentName ? String(body.respondentName).trim() : null,
        answers: normalized.answers as unknown as Prisma.InputJsonValue,
        score: normalized.score,
      },
    });

    await recordAudit({
      companyId: ctx.companyId,
      entity: 'survey',
      entityId: surveyId,
      action: 'response_received',
      actor: ctx.user,
      summary: `Response from ${response.respondentName || 'anonymous'}${response.score === null ? '' : ` · score ${response.score}`}`,
    });

    return NextResponse.json({ response }, { status: 201 });
  } catch (error) {
    console.error('Survey responses POST failed', error);
    return NextResponse.json({ error: 'Could not submit this response' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const ctx = await requireSession(req);
  if (ctx.error) return ctx.error;
  if (!ctx.permissions.canDelete) {
    return NextResponse.json({ error: 'Only an owner or admin can delete responses' }, { status: 403 });
  }

  try {
    const id = new URL(req.url).searchParams.get('id') || '';
    if (!id) return NextResponse.json({ error: 'Response id is required' }, { status: 400 });

    const existing = await prisma.surveyResponse.findFirst({
      where: { id, survey: { companyId: ctx.companyId } },
      include: { survey: { select: { id: true, title: true } } },
    });
    if (!existing) return NextResponse.json({ error: 'Response not found' }, { status: 404 });

    await recordAudit({
      companyId: ctx.companyId,
      entity: 'survey',
      entityId: existing.survey.id,
      action: 'response_deleted',
      actor: ctx.user,
      summary: `A response to ${existing.survey.title} was deleted`,
    });

    await prisma.surveyResponse.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Survey responses DELETE failed', error);
    return NextResponse.json({ error: 'Could not delete this response' }, { status: 500 });
  }
}
