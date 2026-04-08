import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Use the same secret as NextAuth - must match NEXTAUTH_SECRET env var
const SECRET = process.env.NEXTAUTH_SECRET;

export async function getServerSession(req: NextRequest) {
  try {
    if (!SECRET) {
      console.error('NEXTAUTH_SECRET is not set!');
      return null;
    }
    
    // getToken automatically reads the next-auth.session-token cookie
    const token = await getToken({ 
      req,
      secret: SECRET,
      cookieName: 'next-auth.session-token'
    });
    
    if (!token?.email) {
      console.log('No valid token found in cookie');
      return null;
    }
    
    return {
      user: {
        email: token.email,
        name: token.name,
        id: token.sub,
      }
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}
