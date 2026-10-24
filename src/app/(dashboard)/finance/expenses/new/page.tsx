'use client';

import ExpenseForm, { emptyExpense } from '../expense-form';

export default function NewExpensePage() {
  return <ExpenseForm mode="create" initial={emptyExpense} />;
}
