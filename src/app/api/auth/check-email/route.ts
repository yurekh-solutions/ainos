import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, normalizeEmail } from '@/lib/identity';
import { throttle } from '@/lib/security';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Tells the signup form whether an address can still be used before the user
 * fills in company details and documents.
 *
 * The OTP endpoint already refuses to send a signup code for an account with a
 * password, but discovering that on step 2 leaves the applicant stuck halfway
 * through the form. Checking at step 1 lets the UI send them to sign-in instead.
 *
 * `hasPassword: false` means the row came from a Google sign-in and has never
 * been claimed, so registration may continue (same rule as register-company).
 */
export async function POST(req: NextRequest) {
  // The answer is deliberately public for the signup flow, so the only thing to
  // bound is how fast one address can sweep it against a list of emails.
  const blocked = throttle(req, 'check-email', 40, 10 * 60_000);
  if (blocked) return blocked;

  try {
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(String(body?.email || ''));

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }

    const user = await findUserByEmail(email);

    return NextResponse.json({
      exists: !!user,
      hasPassword: !!user?.password,
      // A registered account must sign in; an unclaimed Google row can be claimed.
      canRegister: !user || !user.password,
    });
  } catch (err) {
    console.error('[Auth] check-email error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
