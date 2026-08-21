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
  const cookieJar = await cookies();

  // ── Manual JWE decrypt (same method NextAuth v4 uses internally) ──
  let session = null;
  const tokenCookie =
    cookieJar.get('__Secure-next-auth.session-token') ??
    cookieJar.get('next-auth.session-token');

  if (tokenCookie?.value) {
    try {
      const secret =
        process.env.NEXTAUTH_SECRET ||
        'ainos-stable-signing-secret-9f2c71b4d8e64a0fb35d1c9e8a726453';

      // Derive encryption key exactly like NextAuth v4:
      // HKDF-SHA256(secret, salt="", info="NextAuth.js Generated Encryption Key", len=32)
      const hkdf = (await import('@panva/hkdf')).default;
      const encryptionKey = await hkdf(
        'sha256',
        secret,
        '',
        'NextAuth.js Generated Encryption Key',
        32
      );

      const jose = await import('jose');
      const { payload } = await jose.jwtDecrypt(tokenCookie.value, encryptionKey, {
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
      console.error('[dashboard] JWE decrypt error:', err);
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
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>
    </AuthProvider>
  );
}
