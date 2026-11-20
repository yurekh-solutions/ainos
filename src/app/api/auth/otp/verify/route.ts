import { NextRequest, NextResponse } from 'next/server';
import { throttle } from '@/lib/security';
import { normalizeEmail, normalizePhone } from '@/lib/identity';
import {
  consumeOtp,
  createVerificationProof,
  type OtpChannel,
  type OtpPurpose,
} from '@/lib/verification';

function resolvePurpose(channel: unknown, purpose: unknown): OtpPurpose | null {
  if (purpose !== 'signup') return null;
  if (channel === 'email') return 'signup_email';
  if (channel === 'phone') return 'signup_phone';
  return null;
}

export async function POST(req: NextRequest) {
  // Each code already burns after 5 tries; this caps how many codes one address
  // can try in a row, so a scripted run cannot cycle through the whole space.
  const blocked = throttle(req, 'otp-verify', 20, 10 * 60_000);
  if (blocked) return blocked;

  try {
    const body = await req.json().catch(() => ({}));
    const purpose = resolvePurpose(body?.channel, body?.purpose);

    if (!purpose) {
      return NextResponse.json({ error: 'Unsupported channel or purpose' }, { status: 400 });
    }

    const channel: OtpChannel = purpose === 'signup_email' ? 'email' : 'phone';

    const target = channel === 'email'
      ? normalizeEmail(String(body?.target || ''))
      : normalizePhone(String(body?.target || ''));
    const code = String(body?.code || '');

    if (!target) {
      return NextResponse.json({ error: 'Missing destination' }, { status: 400 });
    }

    const result = await consumeOtp({ channel, target, purpose, code });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Short-lived signed proof; the signup API refuses to create an account
    // without one, so verification cannot be skipped from the client.
    const proof = createVerificationProof({ channel, target, purpose });

    return NextResponse.json({ ok: true, proof, target });
  } catch (err) {
    console.error('[OTP] verify error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
