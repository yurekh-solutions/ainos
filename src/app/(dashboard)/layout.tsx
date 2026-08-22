export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { Sidebar } from '@/components/layout/Sidebar';
import { SessionKeepAlive } from '@/components/auth/SessionKeepAlive';
import { AuthProvider } from '@/components/auth/AuthProvider';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use NextAuth's built-in getToken — handles JWE decryption correctly
  const token = await getToken({
    req: {
      headers: Object.fromEntries(await (await import('next/headers')).headers()),
      cookies: Object.fromEntries(
        (await cookies()).getAll().map(c => [c.name, c.value])
      ),
    } as unknown as Parameters<typeof getToken>[0]['req'],
    secret: authOptions.secret,
    secureCookie: process.env.NODE_ENV === 'production',
  });

  if (!token?.email) {
    redirect('/auth/signin');
  }

  const session = {
    user: {
      name: token.name as string,
      email: token.email as string,
      image: token.picture as string,
      id: token.sub as string,
    },
  };

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
