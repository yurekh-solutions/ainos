import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/permissions';
import { diffFields, recordAudit } from '@/lib/audit';

const STATUSES = ['draft', 'live', 'closed'];
const KINDS = ['rating', 'text', 'choice', 'yesno'];

const AUDITED_FIELDS = ['title', 'description', 'audience', 'status'];

interface QuestionInput {
  prompt: string;
  kind: string;
  required: boolean;
  options: string[];
}

function cleanQuestions(value: unknown): QuestionInput[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      const item = row as Record<string, unknown>;
      const prompt = String(item.prompt || '').trim();
      if (!prompt) return null;
      const kind = KINDS.includes(String(item.kind)) ? String(item.kind) : 'rating';
      const options = Array.isArray(item.options)
        ? item.options.map((option) => String(option).trim()).filter(Boolean)
        : String(item.options || '')
            .split(',')
            .map((option) => option.trim())
            .filter(Boolean);
      return { prompt, kind, required: item.required !== false, options };
    })
    .filter((row): row is QuestionInput => Boolean(row));
}

function questionData(questions: QuestionInput[]) {
  return questions.map((question, index) => ({
    prompt: question.prompt,
    kind: question.kind,
    required: question.required,
    options: question.kind === 'choice' ? (question.options as Prisma.InputJsonValue) : Prisma.JsonNull,
    position: index,
  }));
}

export async function GET(req: NextRequest) {
  const ctx = await requireSession(req);
  if (ctx.error) return ctx.error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const status = searchParams.get('status');
  const search = (searchParams.get('q') || '').trim();

  try {
    if (id) {
      const survey = await prisma.survey.findFirst({
        where: { id, companyId: ctx.companyId },
        include: {
          questions: { orderBy: { position: 'asc' } },
          responses: { orderBy: { submittedAt: 'desc' }, take: 50 },
        },
      });
      if (!survey) return NextResponse.json({ error: 'Survey not found' }, { status: 404 });

      const rated = survey.responses.map((row) => row.score).filter((score): score is number => typeof score === 'number');
      const average = rated.length ? Math.round((rated.reduce((sum, score) => sum + score, 0) / rated.length) * 100) / 100 : null;

      return NextResponse.json({
        survey,
        stats: { responses: survey.responses.length, average },
        sharePath: `/s/${survey.id}`,
        canManage: ctx.canManage,
      });
    }

    const where: Prisma.SurveyWhereInput = { companyId: ctx.companyId };
    if (status && status !== 'all') where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const surveys = await prisma.survey.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { questions: { select: { id: true }, orderBy: { position: 'asc' } }, _count: { select: { responses: true } } },
    });

    const ids = surveys.map((survey) => survey.id);
    const averages = ids.length
      ? await prisma.surveyResponse.groupBy({
          by: ['surveyId'],
          where: { surveyId: { in: ids }, score: { not: null } },
          _avg: { score: true },
        })
      : [];
    const averageMap = new Map(averages.map((row) => [row.surveyId, row._avg.score]));

    const rows = surveys.map((survey) => ({
      id: survey.id,
      title: survey.title,
      description: survey.description,
      audience: survey.audience,
      status: survey.status,
      createdAt: survey.createdAt,
      updatedAt: survey.updatedAt,
      questionCount: survey.questions.length,
      firstQuestion: survey.questions.length ? undefined : null,
      responseCount: survey._count.responses,
      average: averageMap.get(survey.id) !== undefined ? Math.round((averageMap.get(survey.id) as number) * 100) / 100 : null,
    }));

    const [live, drafts, totalResponses] = await Promise.all([
      prisma.survey.count({ where: { companyId: ctx.companyId, status: 'live' } }),
      prisma.survey.count({ where: { companyId: ctx.companyId, status: 'draft' } }),
      prisma.surveyResponse.count({ where: { survey: { companyId: ctx.companyId } } }),
    ]);

    return NextResponse.json({
      surveys: rows,
      summary: { live, drafts, totalResponses },
      canManage: ctx.canManage,
    });
  } catch (error) {
    console.error('Surveys GET failed', error);
    return NextResponse.json({ error: 'Could not load surveys' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ctx = await requireSession(req);
  if (ctx.error) return ctx.error;

  try {
    const body = await req.json();
    const title = String(body.title || '').trim();
    if (!title) return NextResponse.json({ error: 'Survey title is required' }, { status: 400 });

    const questions = cleanQuestions(body.questions);
    if (questions.length === 0) return NextResponse.json({ error: 'Add at least one question' }, { status: 400 });
    if (questions.some((question) => question.kind === 'choice' && question.options.length < 2)) {
      return NextResponse.json({ error: 'Choice questions need at least two options' }, { status: 400 });
    }

    const status = STATUSES.includes(body.status) ? body.status : 'draft';

    const survey = await prisma.survey.create({
      data: {
        title,
        description: body.description ? String(body.description) : null,
        audience: body.audience ? String(body.audience) : null,
        status,
        companyId: ctx.companyId,
        questions: { create: questionData(questions) },
      },
      include: { questions: { orderBy: { position: 'asc' } } },
    });

    await recordAudit({
      companyId: ctx.companyId,
      entity: 'survey',
      entityId: survey.id,
      action: 'created',
      actor: ctx.user,
      summary: `${title} · ${questions.length} question(s) · ${status}`,
    });

    return NextResponse.json({ survey, sharePath: `/s/${survey.id}` }, { status: 201 });
  } catch (error) {
    console.error('Surveys POST failed', error);
    return NextResponse.json({ error: 'Could not create this survey' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const ctx = await requireSession(req);
  if (ctx.error) return ctx.error;

  try {
    const body = await req.json();
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'Survey id is required' }, { status: 400 });

    const existing = await prisma.survey.findFirst({ where: { id, companyId: ctx.companyId } });
    if (!existing) return NextResponse.json({ error: 'Survey not found' }, { status: 404 });

    const data: Prisma.SurveyUpdateInput = {};
    if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim();
    if (body.description !== undefined) data.description = body.description ? String(body.description) : null;
    if (body.audience !== undefined) data.audience = body.audience ? String(body.audience) : null;
    if (body.status !== undefined) {
      if (!STATUSES.includes(body.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      data.status = body.status;
    }

    const questions = body.questions !== undefined ? cleanQuestions(body.questions) : null;
    if (questions) {
      if (questions.length === 0) return NextResponse.json({ error: 'Add at least one question' }, { status: 400 });
      if (questions.some((question) => question.kind === 'choice' && question.options.length < 2)) {
        return NextResponse.json({ error: 'Choice questions need at least two options' }, { status: 400 });
      }
      // Answers reference question positions; rewriting the set would orphan them.
      const answered = await prisma.surveyResponse.count({ where: { surveyId: id } });
      if (answered > 0) {
        return NextResponse.json(
          { error: `This survey already has ${answered} response(s); duplicate it instead of changing the questions` },
          { status: 409 },
        );
      }
    }

    const survey = await prisma.$transaction(async (tx) => {
      if (questions) {
        await tx.surveyQuestion.deleteMany({ where: { surveyId: id } });
        if (questions.length) await tx.surveyQuestion.createMany({ data: questionData(questions).map((row) => ({ ...row, surveyId: id })) });
      }
      return tx.survey.update({
        where: { id },
        data,
        include: { questions: { orderBy: { position: 'asc' } } },
      });
    });

    await recordAudit({
      companyId: ctx.companyId,
      entity: 'survey',
      entityId: survey.id,
      action: survey.status !== existing.status ? 'status_changed' : 'updated',
      actor: ctx.user,
      summary: survey.status !== existing.status
        ? `${survey.title}: ${existing.status} → ${survey.status}`
        : `${survey.title} updated`,
      changes: diffFields(
        existing as unknown as Record<string, unknown>,
        survey as unknown as Record<string, unknown>,
        AUDITED_FIELDS,
      ),
    });

    return NextResponse.json({ survey, sharePath: `/s/${survey.id}` });
  } catch (error) {
    console.error('Surveys PUT failed', error);
    return NextResponse.json({ error: 'Could not update this survey' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const ctx = await requireSession(req);
  if (ctx.error) return ctx.error;
  if (!ctx.permissions.canDelete) return NextResponse.json({ error: 'Only an owner or admin can delete surveys' }, { status: 403 });

  try {
    const id = new URL(req.url).searchParams.get('id') || '';
    if (!id) return NextResponse.json({ error: 'Survey id is required' }, { status: 400 });

    const existing = await prisma.survey.findFirst({ where: { id, companyId: ctx.companyId } });
    if (!existing) return NextResponse.json({ error: 'Survey not found' }, { status: 404 });

    await recordAudit({
      companyId: ctx.companyId,
      entity: 'survey',
      entityId: existing.id,
      action: 'deleted',
      actor: ctx.user,
      summary: `${existing.title} deleted`,
      changes: diffFields(existing as unknown as Record<string, unknown>, {}, AUDITED_FIELDS),
    });

    await prisma.survey.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Surveys DELETE failed', error);
    return NextResponse.json({ error: 'Could not delete this survey' }, { status: 500 });
  }
}
