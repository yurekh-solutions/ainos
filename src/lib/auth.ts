import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getSigningSecret } from '@/lib/security';

export async function getServerSession(req: NextRequest) {
  try {
    // getToken automatically reads the next-auth.session-token cookie
    const token = await getToken({ 
      req,
      // Resolved the same way auth-options.ts signs cookies, so a missing
      // environment variable can never split the reader and the writer onto
      // different keys.
      secret: getSigningSecret(),
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
