'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, Loader2 } from 'lucide-react';
import ExpenseForm, { emptyExpense, type ExpenseFormValues } from '../../expense-form';

export default function EditExpensePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = typeof params?.id === 'string' ? params.id : '';
  const [values, setValues] = useState<ExpenseFormValues | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(`/api/expenses?id=${encodeURIComponent(id)}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Expense not found');
        }
        const data = await res.json();
        const row = data.expense;
        if (cancelled) return;
        setValues({
          ...emptyExpense,
          id: row.id,
          title: row.title || row.description || '',
          amount: String(row.amount ?? ''),
          taxAmount: row.taxAmount ? String(row.taxAmount) : '',
          category: row.category || 'Other',
          vendor: row.vendor || '',
          date: new Date(row.date).toISOString().slice(0, 10),
          paymentMethod: row.paymentMethod || 'cash',
          receipt: row.receipt || '',
          description: row.description || '',
          status: row.status,
          submittedBy: row.submittedBy,
          approvedBy: row.approvedBy,
          rejectionReason: row.rejectionReason,
        });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Expense not found');
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6" style={{ background: 'var(--page-gradient)' }}>
        <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-5 text-center">
          <AlertCircle className="mx-auto mb-2 h-6 w-6 text-rose-600" />
          <p className="text-sm font-semibold text-rose-800">{error}</p>
          <button
            type="button"
            onClick={() => router.push('/finance/expenses')}
            className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Back to expenses
          </button>
        </div>
      </div>
    );
  }

  if (!values) {
    return (
      <div
        className="flex h-full items-center justify-center gap-2 p-6 text-sm"
        style={{ background: 'var(--page-gradient)', color: 'hsl(var(--muted-foreground))' }}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading expense…
      </div>
    );
  }

  return <ExpenseForm mode="edit" initial={values} />;
}
