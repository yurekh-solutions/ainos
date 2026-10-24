'use client';

import { useState } from 'react';
import EventForm, { defaultEventRange, emptyEvent } from '../event-form';

export default function NewEventPage() {
  const [initial] = useState(() => ({ ...emptyEvent, ...defaultEventRange() }));
  return <EventForm mode="create" initial={initial} />;
}
