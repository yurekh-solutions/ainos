import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/auth-options';
import { isDevSurface } from '@/lib/security';

export const dynamic = 'force-dynamic';

// Diagnostic endpoint: shows which auth cookies the browser holds and whether
// the session JWT decodes. Visit /ainos/api/auth/debug after a sign-in attempt.
export async function GET(req: NextRequest) {
  // Reports which secrets are configured, the cookie inventory and the decoded
  // session, so it only ever answers outside production. Middleware hides the
  // path as well; this is the second lock on the same door.
  if (!isDevSurface()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

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
