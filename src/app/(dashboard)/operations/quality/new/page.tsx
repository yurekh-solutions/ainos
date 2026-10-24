'use client';

import QualityForm, { emptyQuality } from '../quality-form';

export default function NewQualityCheckPage() {
  return <QualityForm mode="create" initial={emptyQuality} />;
}
