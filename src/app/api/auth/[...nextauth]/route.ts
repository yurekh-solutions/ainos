import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async signIn({ user, account }) {
      console.log('SignIn callback called:', { email: user.email, provider: account?.provider });
      
      if (account?.provider === 'google') {
        try {
          console.log('Connecting to MongoDB...');
          await connectDB();
          console.log('MongoDB connected successfully');

          const existingUser = await User.findOne({ email: user.email });
          console.log('Existing user check:', existingUser ? 'Found' : 'Not found');
          
          if (!existingUser) {
            console.log('Creating new user...');
            const newUser = await User.create({
              email: user.email,
              name: user.name,
              googleId: user.id,
              image: user.image,
              role: 'user',
            });
            console.log('New user created:', newUser._id);
          }

          return true;
        } catch (error) {
          console.error('SignIn error:', error);
          return false;
        }
      }
      return false;
    },
    async session({ session, token }) {
      console.log('Session callback called:', { email: session.user?.email });
      
      if (session.user?.email) {
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: session.user.email });
          if (dbUser) {
            session.user.id = dbUser._id.toString();
            session.user.role = dbUser.role;
            session.user.companyId = dbUser.companyId;
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
    signIn: '/auth/signin',
    error: '/auth/signin',
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
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
});

export { handler as GET, handler as POST };
