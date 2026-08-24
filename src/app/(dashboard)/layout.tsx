export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Sidebar } from '@/components/layout/Sidebar';
import { SessionKeepAlive } from '@/components/auth/SessionKeepAlive';
import { AuthProvider } from '@/components/auth/AuthProvider';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const hasSession =
    cookieStore.get('next-auth.session-token')?.value ||
    cookieStore.get('__Secure-next-auth.session-token')?.value;

  if (!hasSession) {
    redirect('/auth/signin');
  }

  return (
    <AuthProvider>
      <SessionKeepAlive />
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar />
        <main className="flex-1 overflow-auto pt-16 lg:pt-0">
          <div className="min-h-full">{children}</div>
        </main>
      </div>
    </AuthProvider>
  );
}
