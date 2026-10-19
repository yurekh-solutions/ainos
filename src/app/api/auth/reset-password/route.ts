import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { confirmPasswordReset } from '@/lib/firebase';

export async function POST(req: NextRequest) {
  try {
    const { oobCode, newPassword } = await req.json();

    if (!oobCode || !newPassword) {
      return NextResponse.json({ error: 'Reset code and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Complete the reset in Firebase Auth — validates and consumes the
    // single-use oobCode from the email link, returns the user's email.
    let email: string;
    try {
      email = await confirmPasswordReset(oobCode, newPassword);
    } catch (err) {
      const msg = (err as Error)?.message || '';
      const friendly = /EXPIRED|INVALID/i.test(msg)
        ? 'This reset link is invalid or has expired. Please request a new one.'
        : 'Could not reset the password. Please request a new reset link.';
      console.error('[Auth] Firebase reset failed:', msg);
      return NextResponse.json({ error: friendly }, { status: 400 });
    }

    // Mirror the new password into the app database (NextAuth credentials
    // sign-in checks User.password, not Firebase Auth).
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (user) {
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null },
      });
    }

    return NextResponse.json({ message: 'Password reset successfully. You can now sign in.' });
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
