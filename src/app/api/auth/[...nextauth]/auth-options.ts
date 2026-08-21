import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

// NEXTAUTH_URL is set in Render env vars. We strip /ainos to get the root origin,
// then append /ainos/api/auth/callback/google as the OAuth redirect_uri.
const baseUrl =
  process.env.NEXTAUTH_URL_BASE ||
  process.env.NEXTAUTH_URL?.replace(/\/ainos.*$/, '') ||
  'http://localhost:3000';

// Lazy-load prisma only when needed. This guarantees the auth module always loads,
// even if the database is briefly unreachable. The OAuth flow NEVER blocks on DB.
async function getPrisma() {
  try {
    const { prisma } = await import('@/lib/prisma');
    return prisma;
  } catch (err) {
    console.error('[auth] Prisma load failed (non-fatal):', err);
    return null;
  }
}

// Fire-and-forget user provisioning so the OAuth callback never blocks on the DB.
function ensureUserInBackground(email: string, name: string, googleId: string, image?: string | null) {
  getPrisma()
    .then(async (prisma) => {
      if (!prisma) return;
      try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return;
        await prisma.user.create({
          data: {
            email,
            name: name || email,
            googleId,
            image: image ?? null,
            role: 'user',
          },
        });
        console.log('[auth] Created user', email);
      } catch (err) {
        console.error('[auth] Background user create failed:', err);
      }
    })
    .catch(() => {
      /* swallow - sign-in already succeeded */
    });
}

export const authOptions: NextAuthOptions = {
  // Explicit stable secret. If NEXTAUTH_SECRET is missing on the host, fall back
  // to a static value so JWT signing/verification and CSRF stay consistent
  // across every request and every cold start.
  secret:
    process.env.NEXTAUTH_SECRET ||
    'ainos-stable-signing-secret-9f2c71b4d8e64a0fb35d1c9e8a726453',
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'select_account',
          redirect_uri: `${baseUrl}/ainos/api/auth/callback/google`,
        },
      },
    }),
  ],
  // Enable debug logs to help troubleshoot auth issues
  debug: true,
  logger: {
    error(code, metadata) {
      // Don't crash the process on a single auth error
      console.error('[NextAuth] ERROR', code, JSON.stringify(metadata || {}));
    },
    warn(code) {
      console.warn('[NextAuth] WARN', code);
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[NextAuth] DEBUG', code, JSON.stringify(metadata || {}));
      }
    },
  },
  callbacks: {
    // CRITICAL: This callback MUST return true on success.
    // We do all DB work in the background so the OAuth callback never times out.
    async signIn({ user, account, profile }) {
      console.log('[auth] signIn callback', { 
        email: user?.email, 
        provider: account?.provider,
        hasAccount: !!account,
        hasProfile: !!profile,
      });
      
      // Allow sign-in if user has an email (from any OAuth provider)
      if (!user?.email) {
        console.error('[auth] No email in user object, denying sign-in');
        return false;
      }

      // Fire-and-forget user creation. Do NOT await - we want the OAuth flow to complete immediately.
      const googleId = user.id || account?.providerAccountId || '';
      ensureUserInBackground(user.email, user.name || user.email!, googleId, user.image);

      console.log('[auth] Sign-in successful for', user.email);
      return true;
    },
    // Build the session purely from the JWT - no DB calls that could cause timing issues
    async session({ session, token }) {
      if (session.user && token) {
        // Sync values from the JWT - always available, no DB needed
        if (token.email) session.user.email = token.email as string;
        if (token.name) session.user.name = token.name as string;
        if (token.picture) session.user.image = token.picture as string;
        if (token.sub) session.user.id = token.sub;
        if (token.role) session.user.role = token.role as string;
        if (token.companyId) session.user.companyId = token.companyId as string;
      }

      console.log('[auth] Session built for', session.user?.email);
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      const appBase =
        process.env.NEXTAUTH_URL_BASE || 'https://ainos-ywu0.onrender.com';
      console.log('[auth] redirect callback', { url, baseUrl, appBase });
      // Relative URLs (e.g. "/" or "/ainos/auth/signin/") resolve against the app root
      if (url.startsWith('/')) {
        return appBase + url;
      }
      // Same-origin absolute URLs pass through
      if (url.startsWith(appBase)) {
        return url;
      }
      // Anything else: land on the dashboard
      return `${appBase}/ainos/`;
    },
  },
  // NOTE: no custom `cookies` override. NextAuth defaults already use path '/'
  // and, on HTTPS, the standard __Secure- prefixed names. Custom names caused
  // session cookies from older deploys to be ignored.
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 60 * 60, // Update session every hour
  },
};
