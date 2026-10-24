'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, CheckCircle2, ClipboardList, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import RecordHistory from '@/components/audit/RecordHistory';

export const SURVEY_STATUSES = [
  { id: 'draft', label: 'Draft' },
  { id: 'live', label: 'Live' },
  { id: 'closed', label: 'Closed' },
];

export const SURVEY_AUDIENCES = [
  { id: 'customers', label: 'Customers' },
  { id: 'employees', label: 'Employees' },
  { id: 'vendors', label: 'Vendors' },
  { id: 'other', label: 'Other' },
];

export const QUESTION_KINDS = [
  { id: 'rating', label: 'Rating (1–5)' },
  { id: 'text', label: 'Free text' },
  { id: 'choice', label: 'Multiple choice' },
  { id: 'yesno', label: 'Yes / No' },
];

export interface SurveyQuestionValues {
  prompt: string;
  kind: string;
  required: boolean;
  options: string;
}

export interface SurveyFormValues {
  id?: string;
  title: string;
  description: string;
  audience: string;
  status: string;
  questions: SurveyQuestionValues[];
}

const blankQuestion = (): SurveyQuestionValues => ({ prompt: '', kind: 'rating', required: true, options: '' });

export const emptySurvey: SurveyFormValues = {
  title: '',
  description: '',
  audience: 'customers',
  status: 'draft',
  questions: [blankQuestion()],
};

export function surveyFromRecord(record: {
  id: string;
  title?: string | null;
  description?: string | null;
  audience?: string | null;
  status?: string | null;
  questions?: { prompt?: string | null; kind?: string | null; required?: boolean | null; options?: unknown }[];
}): SurveyFormValues {
  return {
    id: record.id,
    title: record.title || '',
    description: record.description || '',
    audience: record.audience || 'other',
    status: record.status || 'draft',
    questions:
      record.questions && record.questions.length
        ? record.questions.map((question) => ({
            prompt: question.prompt || '',
            kind: question.kind || 'rating',
            required: question.required !== false,
            options: Array.isArray(question.options) ? question.options.map((option) => String(option)).join(', ') : '',
          }))
        : [blankQuestion()],
  };
}

const labelClass = 'text-xs font-semibold uppercase tracking-wide';
const fieldClass = 'glass-input w-full rounded-xl px-3 py-2.5 text-sm';

export default function SurveyForm({ mode, initial }: { mode: 'create' | 'edit'; initial: SurveyFormValues }) {
  const router = useRouter();
  const [form, setForm] = useState<SurveyFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof SurveyFormValues>(key: K, value: SurveyFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setQuestion = (index: number, patch: Partial<SurveyQuestionValues>) =>
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((question, position) => (position === index ? { ...question, ...patch } : question)),
    }));

  const addQuestion = () => setForm((prev) => ({ ...prev, questions: [...prev.questions, blankQuestion()] }));

  const removeQuestion = (index: number) =>
    setForm((prev) => ({ ...prev, questions: prev.questions.filter((_, position) => position !== index) }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!form.title.trim()) {
      setError('Give the survey a title.');
      return;
    }
    const questions = form.questions
      .map((question) => ({
        prompt: question.prompt.trim(),
        kind: question.kind,
        required: question.required,
        options: question.options
          .split(',')
          .map((option) => option.trim())
          .filter(Boolean),
      }))
      .filter((question) => question.prompt);

    if (questions.length === 0) {
      setError('Add at least one question.');
      return;
    }
    if (questions.some((question) => question.kind === 'choice' && question.options.length < 2)) {
      setError('Every multiple-choice question needs at least two options.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/surveys', {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: form.id,
          title: form.title.trim(),
          description: form.description.trim(),
          audience: form.audience,
          status: form.status,
          questions,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not save this survey');
      }

      setSaved(true);
      setTimeout(() => {
        router.push('/marketing/surveys');
        router.refresh();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this survey');
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-auto p-4 md:p-6" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl space-y-5 pb-24">
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
              {mode === 'create' ? 'New survey' : `Edit ${form.title || 'survey'}`}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Build the questionnaire, publish it live and collect scored responses
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div
            className="rounded-2xl p-4 md:p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <div className="mb-4 flex items-center gap-2">
              <ClipboardList className="h-4 w-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                Survey details
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Title *
                </span>
                <input
                  value={form.title}
                  onChange={(event) => set('title', event.target.value)}
                  placeholder="Post-service satisfaction survey"
                  className={`${fieldClass} mt-1`}
                  required
                />
              </label>
              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Audience
                </span>
                <select
                  value={form.audience}
                  onChange={(event) => set('audience', event.target.value)}
                  className={`${fieldClass} mt-1`}
                >
                  {SURVEY_AUDIENCES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Status
                </span>
                <select
                  value={form.status}
                  onChange={(event) => set('status', event.target.value)}
                  className={`${fieldClass} mt-1`}
                >
                  {SURVEY_STATUSES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="sm:col-span-2">
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Introduction
                </span>
                <textarea
                  value={form.description}
                  onChange={(event) => set('description', event.target.value)}
                  rows={2}
                  placeholder="Shown to the respondent before they start"
                  className={`${fieldClass} mt-1 resize-none`}
                />
              </label>
            </div>
          </div>

          <div
            className="rounded-2xl p-4 md:p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                Questions ({form.questions.length})
              </h2>
              <button
                type="button"
                onClick={addQuestion}
                className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:bg-black/5"
                style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
              >
                <Plus className="h-3.5 w-3.5" />
                Add question
              </button>
            </div>

            <div className="space-y-4">
              {form.questions.map((question, index) => (
                <div
                  key={index}
                  className="rounded-xl p-3"
                  style={{ border: '1px solid hsl(var(--border) / 0.7)' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Question {index + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      disabled={form.questions.length === 1}
                      className="rounded-lg p-1.5 transition hover:bg-rose-50 disabled:opacity-40"
                      style={{ color: 'hsl(var(--error))' }}
                      aria-label={`Remove question ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    value={question.prompt}
                    onChange={(event) => setQuestion(index, { prompt: event.target.value })}
                    placeholder="How satisfied are you with the service?"
                    className={`${fieldClass} mt-2`}
                  />
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label>
                      <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                        Answer type
                      </span>
                      <select
                        value={question.kind}
                        onChange={(event) => setQuestion(index, { kind: event.target.value })}
                        className={`${fieldClass} mt-1`}
                      >
                        {QUESTION_KINDS.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex items-end pb-2.5">
                      <span className="flex items-center gap-2 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={(event) => setQuestion(index, { required: event.target.checked })}
                          className="h-4 w-4 rounded"
                        />
                        Required
                      </span>
                    </label>
                    {question.kind === 'choice' && (
                      <label className="sm:col-span-2">
                        <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                          Options (comma separated)
                        </span>
                        <input
                          value={question.options}
                          onChange={(event) => setQuestion(index, { options: event.target.value })}
                          placeholder="Excellent, Good, Average, Poor"
                          className={`${fieldClass} mt-1`}
                        />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <RecordHistory entity="survey" entityId={form.id} />

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
              disabled={saving || saved}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
                boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.32)',
              }}
            >
              {saved ? <CheckCircle2 className="h-4 w-4" /> : saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saved ? 'Saved' : saving ? 'Saving…' : mode === 'create' ? 'Create survey' : 'Save changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
