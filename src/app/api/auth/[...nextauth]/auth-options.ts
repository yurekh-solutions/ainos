import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';

export const authOptions: NextAuthOptions = {
  secret:
    process.env.NEXTAUTH_SECRET ||
    'ainos-stable-signing-secret-9f2c71b4d8e64a0fb35d1c9e8a726453',
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error('Invalid email or password');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error('Invalid email or password');
        }

        // Check company approval status
        if (user.companyId) {
          const company = await prisma.company.findUnique({
            where: { id: user.companyId },
            select: { onboardingStatus: true },
          });
          // Platform admins always get in — they need access to review and approve.
          if (!isAdmin(user.email) && company?.onboardingStatus !== 'approved') {
            throw new Error(company?.onboardingStatus === 'rejected' ? 'ACCOUNT_REJECTED' : 'PENDING_APPROVAL');
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          companyId: user.companyId ?? undefined,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          // Google sign-in is only allowed for emails that already have a
          // registered AINOS account — never auto-create one from Google.
          if (!existingUser) {
            return '/auth/signin?error=GoogleNoAccount';
          }

          // Password-less rows were auto-created by the legacy Google flow,
          // never properly registered — they count as unregistered here.
          if (!existingUser.password) {
            return '/auth/signin?error=GoogleNoAccount';
          }

          // Link the Google identity to the registered account on first use.
          if (!existingUser.googleId) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { googleId: user.id, image: existingUser.image || user.image },
            });
          }

          let companyId = existingUser.companyId;
          if (!companyId) {
            // Registered user without a company yet — create a PENDING one.
            // It becomes usable only after admin approval, like registrations.
            const company = await prisma.company.create({
              data: {
                name: `${existingUser.name || existingUser.email}'s Company`,
                email: existingUser.email!,
                companyType: 'Private Limited',
                onboardingStatus: 'pending',
                createdBy: existingUser.email!,
              },
            });
            companyId = company.id;
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { companyId: company.id, role: existingUser.role ?? 'owner' },
            });
          }

          // Approval gate — platform admins always pass; everyone else needs
          // an approved company (pending / rejected / suspended are blocked).
          if (!isAdmin(existingUser.email)) {
            const company = await prisma.company.findUnique({
              where: { id: companyId },
              select: { onboardingStatus: true },
            });
            if (company && company.onboardingStatus !== 'approved') {
              return company.onboardingStatus === 'rejected'
                ? '/auth/signin?error=GoogleRejected'
                : '/auth/signin?error=GooglePendingApproval';
            }
          }

          return true;
        } catch (error) {
          console.error('SignIn error:', error);
          return '/auth/signin?error=GoogleError';
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user?.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email },
          });
          if (dbUser) {
            session.user.id = dbUser.id;
            session.user.role = dbUser.role;
            session.user.companyId = dbUser.companyId || undefined;
          }
        } catch (error) {
          console.error('Session error:', error);
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.companyId = (user as { companyId?: string }).companyId;
      }
      // If no user object (subsequent requests), fetch companyId from DB
      if (!token.companyId && token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
            select: { companyId: true },
          });
          if (dbUser?.companyId) {
            token.companyId = dbUser.companyId;
          }
        } catch (error) {
          console.error('JWT companyId fetch error:', error);
        }
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      if (url.startsWith(baseUrl)) {
        return url;
      }
      return `${baseUrl}/`;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
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
