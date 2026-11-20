import { notFound } from 'next/navigation';
import { isDevSurface } from '@/lib/security';
import TestAuthPanel from './TestAuthPanel';

// The panel is a debugging aid with demo credentials and registration
// buttons, so in production the route answers 404 instead of rendering it.
export default function TestAuthPage() {
  if (!isDevSurface()) notFound();
  return <TestAuthPanel />;
}
