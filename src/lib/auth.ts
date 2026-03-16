import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function getServerSession(req?: NextRequest) {
  if (!req) {
    return null;
  }
  
  const token = await getToken({ 
    req: req as any,
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  if (!token) {
    return null;
  }
  
  return {
    user: {
      email: token.email,
      name: token.name,
      id: token.sub,
    }
  };
}
