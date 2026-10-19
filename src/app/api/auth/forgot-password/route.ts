import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/firebase';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    if (!user) {
      return NextResponse.json({ message: 'If an account exists with that email, a reset link has been sent.' });
    }

    if (!user.password) {
      return NextResponse.json({ error: 'This account uses Google sign-in. Please sign in with Google.' }, { status: 400 });
    }

    // Firebase emails the reset link — delivers to ANY inbox, no domain
    // verification needed. The link lands back on /auth/reset-password.
    try {
      await sendPasswordResetEmail(user.email);
    } catch (err) {
      console.error('[Auth] Firebase reset email failed:', err);
      return NextResponse.json(
        { error: 'Could not send the reset email. Please try again in a moment.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'If an account exists with that email, a reset link has been sent.',
    });
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
