import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, passwordResetEmailTemplate } from '@/lib/email';
import { randomBytes, createHash } from 'crypto';

const BASE_URL = process.env.NEXTAUTH_URL_BASE || 'https://ainos-ywu0.onrender.com';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Case-insensitive lookup: PostgreSQL is case-sensitive, so use findFirst
    // with mode: 'insensitive' to match emails regardless of casing.
    const user = await prisma.user.findFirst({
      where: { email: { equals: email.toLowerCase().trim(), mode: 'insensitive' } },
    });

    if (!user) {
      // Enumeration-safe: always return success even if user doesn't exist
      return NextResponse.json({ message: 'If an account exists with that email, a reset link has been sent.' });
    }

    if (!user.password) {
      return NextResponse.json({ error: 'This account uses Google sign-in. Please sign in with Google.' }, { status: 400 });
    }

    // Generate secure reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenHash = createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store hashed token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: resetTokenHash,
        resetTokenExpiry,
      },
    });

    // Build reset URL
    const resetUrl = `${BASE_URL}/auth/reset-password?token=${resetToken}`;

    // Send email via Brevo
    try {
      await sendEmail({
        to: user.email,
        subject: 'Reset Your AINOS Password',
        html: passwordResetEmailTemplate(resetUrl),
      });
      console.log('[Auth] Reset email sent via Brevo to:', user.email);
    } catch (err) {
      const errMsg = (err as Error)?.message || 'Unknown error';
      console.error('[Auth] Brevo email failed:', errMsg);
      // Clear the token if email fails
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: null, resetTokenExpiry: null },
      });
      return NextResponse.json(
        { error: 'Could not send the reset email. Please try again later.' },
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
