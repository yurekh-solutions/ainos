import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key-at-least-32-characters-long';

export async function getServerSession(req: NextRequest) {
  try {
    const token = await getToken({ 
      req,
      secret: SECRET
    });
    
    if (!token?.email) {
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
