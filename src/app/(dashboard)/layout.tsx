export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { Sidebar } from '@/components/layout/Sidebar';
import { SessionKeepAlive } from '@/components/auth/SessionKeepAlive';
import { AuthProvider } from '@/components/auth/AuthProvider';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side session check — 100% reliable, no client-side fetch race condition
  const session = await getServerSession(authOptions);

  if (!session) {
    // TEMP DEBUG: show cookie state instead of redirecting
    const { cookies } = await import('next/headers');
    const cookieJar = await cookies();
    const allCookies = cookieJar.getAll().map(c => ({ name: c.name, len: c.value.length }));
    const sessionCookie = cookieJar.get('__Secure-next-auth.session-token');
    console.error('[dashboard layout] session is null! cookies:', JSON.stringify(allCookies), 'sessionCookie:', sessionCookie ? `len=${sessionCookie.value.length}` : 'NOT FOUND');
    return (
      <div style={{ padding: '40px', fontFamily: 'monospace', background: '#1a1a2e', color: '#eee', minHeight: '100vh' }}>
        <h2 style={{ color: '#e74c3c' }}>🔍 Dashboard Debug — Session Missing</h2>
        <p><strong>getServerSession() returned:</strong> null</p>
        <p><strong>Cookies found ({allCookies.length}):</strong></p>
        <pre>{JSON.stringify(allCookies, null, 2)}</pre>
        <p><strong>Session cookie:</strong> {sessionCookie ? `FOUND (len=${sessionCookie.value.length})` : 'NOT FOUND'}</p>
        <hr style={{ margin: '20px 0' }} />
        <p>If you see session-token in the list above, getServerSession failed to decode the JWT. Check the secret.</p>
      </div>
    );
  }

  return (
    <AuthProvider>
      <SessionKeepAlive />
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>
    </AuthProvider>
  );
}
