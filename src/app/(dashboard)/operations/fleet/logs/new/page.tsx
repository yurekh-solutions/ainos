'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import LogForm, { emptyLog } from '../log-form';

function NewLogView() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get('vehicleId') || '';
  return <LogForm mode="create" initial={{ ...emptyLog, vehicleId }} />;
}

export default function NewVehicleLogPage() {
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
      <NewLogView />
    </Suspense>
  );
}
