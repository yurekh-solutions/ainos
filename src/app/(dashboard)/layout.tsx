export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { Sidebar } from '@/components/layout/Sidebar';
import { SessionKeepAlive } from '@/components/auth/SessionKeepAlive';
import { AuthProvider } from '@/components/auth/AuthProvider';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Manually read and decrypt session cookie (bypasses NextAuth v4 + Next.js 16 issues)
  const cookieStore = await cookies();
  const sessionCookie =
    cookieStore.get('__Secure-next-auth.session-token')?.value ||
    cookieStore.get('next-auth.session-token')?.value;

  let session = null;

  if (sessionCookie) {
    try {
      const secret =
        process.env.NEXTAUTH_SECRET ||
        'ainos-stable-signing-secret-9f2c71b4d8e64a0fb35d1c9e8a726453';

      // NextAuth v4 uses JWE encryption with HKDF-derived key
      const hkdf = (await import('@panva/hkdf')).default;
      const encryptionKey = await hkdf(
        'sha256',
        secret,
        '',
        'NextAuth.js Generated Encryption Key',
        32
      );

      const jose = await import('jose');
      const { payload } = await jose.jwtDecrypt(sessionCookie, encryptionKey, {
        clockTolerance: 15,
      });

      if (payload?.email) {
        session = {
          user: {
            name: payload.name as string,
            email: payload.email as string,
            image: payload.picture as string,
            id: payload.sub as string,
          },
        };
      }
    } catch (err) {
      console.error('[dashboard] Session decrypt error:', err);
    }
  }

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <AuthProvider>
      <SessionKeepAlive />
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="min-h-full">{children}</div>
        </main>
      </div>
    </AuthProvider>
  );
}
