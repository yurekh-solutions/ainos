import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';

const baseUrl = process.env.NEXTAUTH_URL_BASE || process.env.NEXTAUTH_URL?.replace(/\/ainos.*$/, '') || 'http://localhost:3000';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          redirect_uri: `${baseUrl}/ainos/api/auth/callback/google`,
        },
      },
    }),
  ],
  debug: true,
  logger: {
    error(code, metadata) {
      console.error('NextAuth ERROR:', code, JSON.stringify(metadata));
    },
    warn(code) {
      console.warn('NextAuth WARN:', code);
    },
    debug(code, metadata) {
      console.log('NextAuth DEBUG:', code, JSON.stringify(metadata));
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      console.log('SignIn callback called:', { email: user.email, provider: account?.provider });
      
      if (account?.provider === 'google') {
        try {
          const existingUser = await prisma.user.findUnique({ where: { email: user.email! } });
          console.log('Existing user check:', existingUser ? 'Found' : 'Not found');
          
          if (!existingUser) {
            console.log('Creating new user...');
            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name || user.email!,
                googleId: user.id,
                image: user.image,
                role: 'user',
              },
            });
            console.log('New user created:', newUser.id);
          }

          return true;
        } catch (error) {
          console.error('SignIn error:', error);
          // Still allow sign-in even if DB fails - user can be created later
          return true;
        }
      }
      return false;
    },
    async session({ session, token }) {
      console.log('Session callback called:', { email: session.user?.email });
      
      if (session.user?.email) {
        try {
          const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
          if (dbUser) {
            session.user.id = dbUser.id;
            session.user.role = dbUser.role;
            session.user.companyId = dbUser.companyId || undefined;
            console.log('Session enriched with user data');
          }
        } catch (error) {
          console.error('Session error:', error);
        }
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
  pages: {
    signIn: '/ainos/auth/signin',
    error: '/ainos/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        // Must be '/' (not '/ainos'): pages fetch '/api/...' without the basePath,
        // and a '/ainos'-scoped cookie is never sent with those requests -> 401s.
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    state: {
      name: `next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 900,
      },
    },
    pkceCodeVerifier: {
      name: `next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 900,
      },
    },
  },
};
