'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import TaskForm, { emptyTask } from '../task-form';

function NewTaskView() {
  const searchParams = useSearchParams();
  const assetId = searchParams.get('assetId') || '';
  return <TaskForm mode="create" initial={{ ...emptyTask, assetId }} />;
}

export default function NewMaintenanceTaskPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex h-full items-center justify-center gap-2 p-6 text-sm"
          style={{ background: 'var(--page-gradient)', color: 'hsl(var(--muted-foreground))' }}
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading form…
        </div>
      }
    >
      <NewTaskView />
    </Suspense>
  );
}
