'use client';

import DocumentForm, { emptyDocument } from '../document-form';

export default function NewDocumentPage() {
  return <DocumentForm mode="create" initial={emptyDocument} />;
}
