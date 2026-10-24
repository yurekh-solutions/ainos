import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, passwordResetEmailTemplate } from '@/lib/email';
import { findUserByEmail, normalizeEmail } from '@/lib/identity';
import { isResetThrottled, markResetRequested } from '@/lib/verification';
import { randomBytes, createHash } from 'crypto';

/**
 * Reset links must point at the host the user is actually on. The old code
 * hard-coded the Render URL, so links opened on any other host (localhost,
 * custom domain, preview deploy) either 404'd or stitched the wrong session.
 */
function requestOrigin(req: NextRequest): string {
  const proto = req.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (host) return `${proto}://${host}`;
  const fallback = process.env.NEXTAUTH_URL_BASE || process.env.NEXTAUTH_URL || 'https://ainos-ywu0.onrender.com';
  return fallback.replace(/\/+$/, '');
}

const GENERIC_MESSAGE = 'If an account exists with that email, a reset link has been sent.';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const target = normalizeEmail(email);
    const user = await findUserByEmail(target);

    // Enumeration-safe: same response whether or not the account exists.
    if (!user) {
      return NextResponse.json({ message: GENERIC_MESSAGE });
    }

    // Every account may reset, including password-less rows created by an
    // earlier Google sign-in: opening the link proves the owner controls the
    // inbox, and new signups claim such rows the same way. Refusing here used
    // to dead-end those accounts, since Google sign-in is gated to registered
    // emails and they had no password to fall back on.
    if (await isResetThrottled(target)) {
      return NextResponse.json(
        { error: 'Too many reset requests. Please wait 15 minutes and try again.' },
        { status: 429 },
      );
    }

    const resetToken = randomBytes(32).toString('hex');
    const resetTokenHash = createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: resetTokenHash, resetTokenExpiry },
    });

    const resetUrl = `${requestOrigin(req)}/auth/reset-password?token=${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Reset your AINOS password',
        html: passwordResetEmailTemplate(resetUrl),
      });
      console.log('[Auth] Reset email accepted for:', user.email);
    } catch (err) {
      console.error('[Auth] Reset email failed:', (err as Error)?.message);
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: null, resetTokenExpiry: null },
      });
      return NextResponse.json(
        { error: 'We could not send the reset email. Please try again in a few minutes.' },
        { status: 502 },
      );
    }

    await markResetRequested(target);

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (err) {
    console.error('[Auth] forgot-password error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
