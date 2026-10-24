'use client';

import { useState } from 'react';
import ShiftForm, { defaultShiftRange, emptyShift } from '../shift-form';

export default function NewShiftPage() {
  const [initial] = useState(() => ({ ...emptyShift, ...defaultShiftRange() }));
  return <ShiftForm mode="create" initial={initial} />;
}
