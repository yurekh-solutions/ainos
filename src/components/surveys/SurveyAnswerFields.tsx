'use client';

export interface SurveyQuestionView {
  id: string;
  prompt: string;
  kind: string;
  required: boolean;
  options?: unknown;
}

interface Props {
  questions: SurveyQuestionView[];
  answers: Record<string, string>;
  setAnswer: (questionId: string, value: string) => void;
}

function optionList(options: unknown): string[] {
  return Array.isArray(options) ? options.map((option) => String(option)) : [];
}

/**
 * Renders one input per question. Shared by the in-dashboard screen and the public
 * `/s/[id]` link so both stay pixel- and behaviour-identical.
 */
export default function SurveyAnswerFields({ questions, answers, setAnswer }: Props) {
  return (
    <>
      {questions.map((question, index) => {
        const options = optionList(question.options);
        const selected = answers[question.id] || '';

        return (
          <div key={question.id} className="rounded-xl p-3" style={{ border: '1px solid hsl(var(--border) / 0.7)' }}>
            <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              {index + 1}. {question.prompt}
              {question.required && <span style={{ color: 'hsl(var(--error))' }}> *</span>}
            </p>

            {question.kind === 'rating' && (
              <div className="mt-3 flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAnswer(question.id, String(value))}
                    className={`h-9 w-9 rounded-lg border text-sm font-semibold transition ${
                      selected === String(value) ? 'text-white' : 'hover:bg-black/5'
                    }`}
                    style={
                      selected === String(value)
                        ? { background: 'hsl(var(--primary))', borderColor: 'hsl(var(--primary))' }
                        : { borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }
                    }
                  >
                    {value}
                  </button>
                ))}
              </div>
            )}

            {question.kind === 'yesno' && (
              <div className="mt-3 flex gap-2">
                {['yes', 'no'].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAnswer(question.id, value)}
                    className={`rounded-lg border px-4 py-1.5 text-sm font-semibold capitalize transition ${
                      selected === value ? 'text-white' : 'hover:bg-black/5'
                    }`}
                    style={
                      selected === value
                        ? { background: 'hsl(var(--primary))', borderColor: 'hsl(var(--primary))' }
                        : { borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }
                    }
                  >
                    {value}
                  </button>
                ))}
              </div>
            )}

            {question.kind === 'choice' && (
              <select
                value={selected}
                onChange={(event) => setAnswer(question.id, event.target.value)}
                className="glass-input mt-3 w-full rounded-xl px-3 py-2.5 text-sm"
              >
                <option value="">Choose…</option>
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}

            {question.kind === 'text' && (
              <textarea
                value={selected}
                onChange={(event) => setAnswer(question.id, event.target.value)}
                rows={3}
                placeholder="Type the answer…"
                className="glass-input mt-3 w-full resize-none rounded-xl px-3 py-2.5 text-sm"
              />
            )}
          </div>
        );
      })}
    </>
  );
}
