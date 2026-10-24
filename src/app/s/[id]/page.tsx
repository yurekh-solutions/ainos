'use client';

import { use, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Send } from 'lucide-react';
import SurveyAnswerFields, { type SurveyQuestionView } from '@/components/surveys/SurveyAnswerFields';

interface PublicSurvey {
  id: string;
  title: string;
  description?: string | null;
  audience?: string | null;
  questions: SurveyQuestionView[];
}

const labelClass = 'text-xs font-semibold uppercase tracking-wide';

export default function PublicSurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [survey, setSurvey] = useState<PublicSurvey | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [respondentName, setRespondentName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await fetch(`/api/public/surveys/${id}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'This survey is not available');
        if (active) setSurvey(data.survey);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'This survey is not available');
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
      const res = await fetch(`/api/public/surveys/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: 'var(--page-gradient, hsl(var(--background)))' }}>
      <div className="mx-auto max-w-2xl space-y-5">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-20 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading survey…
          </div>
        )}

        {!loading && !survey && (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}>
            <AlertCircle className="mx-auto h-7 w-7" style={{ color: 'hsl(var(--error))' }} />
            <p className="mt-3 text-base font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              {error || 'This survey is not available'}
            </p>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              The link may have expired, or the survey is no longer accepting responses.
            </p>
          </div>
        )}

        {survey && done && (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}>
            <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-600" />
            <p className="mt-3 text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              Thank you
            </p>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Your response to “{survey.title}” has been recorded.
            </p>
            <button
              type="button"
              onClick={() => {
                setAnswers({});
                setRespondentName('');
                setDone(false);
              }}
              className="mt-5 rounded-xl border px-4 py-2 text-sm font-semibold"
              style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            >
              Submit another response
            </button>
          </div>
        )}

        {survey && !done && (
          <>
            <header className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
                {survey.title}
              </h1>
              {survey.description && (
                <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {survey.description}
                </p>
              )}
            </header>

            <form
              onSubmit={submit}
              className="space-y-4 rounded-2xl p-4 md:p-5"
              style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
            >
              <label className="block">
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Your name
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

              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
                  boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.32)',
                }}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {saving ? 'Submitting…' : 'Submit response'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
