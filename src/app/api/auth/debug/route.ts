import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/auth-options';

export const dynamic = 'force-dynamic';

// Diagnostic endpoint: shows which auth cookies the browser holds and whether
// the session JWT decodes. Visit /ainos/api/auth/debug after a sign-in attempt.
export async function GET(req: NextRequest) {
  let session: unknown;
  try {
    session = await getServerSession(authOptions);
  } catch (err) {
    session = { error: String(err) };
  }

  return NextResponse.json({
    envSecretSet: !!process.env.NEXTAUTH_SECRET,
    nodeEnv: process.env.NODE_ENV,
    nextauthUrl: process.env.NEXTAUTH_URL,
    cookies: req.cookies.getAll().map((c) => ({
      name: c.name,
      valueLength: c.value.length,
    })),
    session,
  });
}
