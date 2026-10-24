import type { SurveyQuestion } from '@prisma/client';

export type NormalizedAnswer = { questionId: string; prompt: string; kind: string; value: string };

export type NormalizeResult =
  | { ok: true; answers: NormalizedAnswer[]; score: number | null }
  | { ok: false; error: string };

/**
 * Shared by the internal respond screen and the public survey link, so both paths
 * enforce exactly the same rules (required questions, 1–5 ratings, yes/no options).
 */
export function normalizeAnswers(questions: SurveyQuestion[], submitted: unknown): NormalizeResult {
  const rows = Array.isArray(submitted) ? submitted : [];
  const answerMap = new Map<string, unknown>();
  for (const row of rows) {
    const item = row as Record<string, unknown>;
    if (item.questionId) answerMap.set(String(item.questionId), item.value);
  }

  const answers: NormalizedAnswer[] = [];
  const ratings: number[] = [];

  for (const question of questions) {
    const raw = answerMap.get(question.id);
    const value = raw === undefined || raw === null ? '' : String(raw).trim();
    if (!value && question.required) {
      return { ok: false, error: `Please answer: ${question.prompt}` };
    }
    if (!value) continue;

    if (question.kind === 'rating') {
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed < 1 || parsed > 5) {
        return { ok: false, error: `Rating must be between 1 and 5: ${question.prompt}` };
      }
      ratings.push(parsed);
    }
    if (question.kind === 'yesno' && !['yes', 'no'].includes(value.toLowerCase())) {
      return { ok: false, error: `Answer yes or no: ${question.prompt}` };
    }
    if (question.kind === 'choice') {
      const options = Array.isArray(question.options) ? (question.options as unknown[]).map((option) => String(option)) : [];
      if (options.length && !options.includes(value)) {
        return { ok: false, error: `Pick one of the listed options: ${question.prompt}` };
      }
    }

    answers.push({ questionId: question.id, prompt: question.prompt, kind: question.kind, value });
  }

  const score = ratings.length
    ? Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 100) / 100
    : null;

  return { ok: true, answers, score };
}
