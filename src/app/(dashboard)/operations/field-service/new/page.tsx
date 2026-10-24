'use client';

import JobForm, { emptyJob } from '../job-form';

export default function NewServiceJobPage() {
  return <JobForm mode="create" initial={emptyJob} />;
}
