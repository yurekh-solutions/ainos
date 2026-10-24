'use client';

import FollowUpForm, { emptyFollowUp } from '../follow-up-form';

export default function NewFollowUpPage() {
  return <FollowUpForm mode="create" initial={emptyFollowUp} />;
}
