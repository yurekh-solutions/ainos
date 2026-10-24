'use client';

import RecurringForm, { emptyRecurring } from '../recurring-form';

export default function NewRecurringInvoicePage() {
  return <RecurringForm mode="create" initial={emptyRecurring} />;
}
