'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle2, ClipboardList, Loader2, Send } from 'lucide-react';
import SurveyAnswerFields, { type SurveyQuestionView } from '@/components/surveys/SurveyAnswerFields';

interface SurveyDetail {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  questions: SurveyQuestionView[];
}

const labelClass = 'text-xs font-semibold uppercase tracking-wide';

export default function RespondPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const [survey, setSurvey] = useState<SurveyDetail | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [respondentName, setRespondentName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;

    (async () => {
      try {
        const res = await fetch(`/api/surveys?id=${id}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Could not load this survey');
        if (active) setSurvey(data.survey);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Could not load this survey');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!survey) return;
    const missing = survey.questions.find((question) => question.required && !(answers[question.id] || '').trim());
    if (missing) {
      setError(`Please answer: ${missing.prompt}`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/surveys/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyId: survey.id,
          respondentName: respondentName.trim(),
          answers: survey.questions.map((question) => ({ questionId: question.id, value: answers[question.id] || '' })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not submit this response');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit this response');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm" style={{ background: 'var(--page-gradient)', color: 'hsl(var(--muted-foreground))' }}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading survey…
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="flex h-full items-center justify-center p-6" style={{ background: 'var(--page-gradient)' }}>
        <div className="max-w-md rounded-2xl p-6 text-center" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}>
          <AlertCircle className="mx-auto h-6 w-6" style={{ color: 'hsl(var(--error))' }} />
          <p className="mt-3 text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
            {error || 'Survey not found'}
          </p>
          <button
            type="button"
            onClick={() => router.push('/marketing/surveys')}
            className="mt-4 rounded-xl px-4 py-2 text-sm font-semibold text-white"
            style={{ background: 'hsl(var(--primary))' }}
          >
            Back to surveys
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4 md:p-6" style={{ background: 'var(--page-gradient)' }}>
      <div className="mx-auto max-w-2xl space-y-5 pb-24">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.push('/marketing/surveys')}
            className="rounded-lg border p-2 transition hover:bg-black/5"
            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            aria-label="Back to surveys"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
              {survey.title}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {survey.description || 'Record a response on behalf of the respondent'}
            </p>
          </div>
        </div>

        {survey.status !== 'live' ? (
          <div className="rounded-2xl p-5" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}>
            <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              This survey is not live
            </p>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Set the status to “Live” in the survey editor before collecting responses.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => router.push(`/marketing/surveys/${survey.id}/edit`)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
                style={{ background: 'hsl(var(--primary))' }}
              >
                Open editor
              </button>
              <button
                type="button"
                onClick={() => router.push(`/s/${survey.id}`)}
                className="rounded-xl border px-4 py-2 text-sm font-semibold"
                style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
              >
                Open public link
              </button>
            </div>
          </div>
        ) : done ? (
          <div className="rounded-2xl p-6 text-center" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}>
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
            <p className="mt-3 text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              Response recorded
            </p>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              The answers and score are now in the survey response log.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => {
                  setAnswers({});
                  setRespondentName('');
                  setDone(false);
                }}
                className="rounded-xl border px-4 py-2 text-sm font-semibold"
                style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
              >
                Add another response
              </button>
              <button
                type="button"
                onClick={() => router.push('/marketing/surveys')}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
                style={{ background: 'hsl(var(--primary))' }}
              >
                Back to surveys
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="space-y-4 rounded-2xl p-4 md:p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                {survey.questions.length} questions
              </h2>
            </div>

            <label className="block">
              <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                Respondent name
              </span>
              <input
                value={respondentName}
                onChange={(event) => setRespondentName(event.target.value)}
                placeholder="Optional"
                className="glass-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm"
              />
            </label>

            <SurveyAnswerFields
              questions={survey.questions}
              answers={answers}
              setAnswer={(questionId, value) => setAnswers((prev) => ({ ...prev, [questionId]: value }))}
            />

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => router.push('/marketing/surveys')}
                className="rounded-xl border px-5 py-2.5 text-sm font-semibold transition hover:bg-black/5"
                style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
                  boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.32)',
                }}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {saving ? 'Submitting…' : 'Submit response'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
