import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeEmail, normalizePhone, findUserByEmail } from '@/lib/identity';
import { issueOtp, OTP_TTL_MS, type OtpChannel, type OtpPurpose } from '@/lib/verification';
import { sendEmail, otpEmailTemplate } from '@/lib/email';
import { sendSmsOtp, smsConfigured } from '@/lib/sms';

const EXPIRY_MINUTES = Math.round(OTP_TTL_MS / 60000);

function resolvePurpose(channel: unknown, purpose: unknown): OtpPurpose | null {
  if (purpose !== 'signup') return null;
  if (channel === 'email') return 'signup_email';
  if (channel === 'phone') return 'signup_phone';
  return null;
}

function clientIp(req: NextRequest): string | undefined {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    undefined
  );
}

export async function POST(req: NextRequest) {
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

    if (channel === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }
    if (channel === 'phone' && target.length < 10) {
      return NextResponse.json({ error: 'Enter a valid phone number' }, { status: 400 });
    }

    // Signup email: stop here if the account already exists, so the user is
    // sent to sign-in instead of verifying an address that is taken.
    if (channel === 'email') {
      const existing = await findUserByEmail(target);
      if (existing?.password) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please sign in instead.' },
          { status: 409 },
        );
      }
    }

    // Phone OTP is optional when no SMS provider is configured. Returning an
    // error here would trap the applicant on the verification step with no way
    // forward, so we issue the code and report delivered:false; the client then
    // falls back to "our team will verify this number during review".
    // (register-company only enforces phone proof when smsConfigured() is true.)

    const issued = await issueOtp({ channel, target, purpose, ipAddress: clientIp(req) });
    if (!issued.ok || !issued.code) {
      return NextResponse.json(
        { error: issued.error, retryAfter: issued.retryAfterSeconds },
        { status: 429 },
      );
    }

    if (channel === 'email') {
      try {
        await sendEmail({
          to: target,
          subject: `${issued.code} is your AINOS verification code`,
          html: otpEmailTemplate({
            code: issued.code,
            heading: 'Verify your email',
            intro: 'Enter this code in the AINOS sign-up form to confirm your email address.',
            expiryMinutes: EXPIRY_MINUTES,
          }),
        });
      } catch (err) {
        console.error('[OTP] Email delivery failed:', (err as Error)?.message);
        await prisma.verificationCode.updateMany({
          where: { channel, target, purpose, consumedAt: null },
          data: { consumedAt: new Date() },
        });
        return NextResponse.json(
          { error: 'We could not send the email. Please try again in a moment.' },
          { status: 502 },
        );
      }
      return NextResponse.json({ ok: true, channel, expiresIn: EXPIRY_MINUTES * 60, delivered: true });
    }

    // phone
    if (!smsConfigured()) {
      console.warn('[OTP] SMS provider not configured — dev code:', issued.code);
      return NextResponse.json({
        ok: true,
        channel,
        expiresIn: EXPIRY_MINUTES * 60,
        delivered: false,
        devCode: process.env.NODE_ENV === 'production' ? undefined : issued.code,
      });
    }

    try {
      await sendSmsOtp(target, issued.code);
    } catch (err) {
      console.error('[OTP] SMS delivery failed:', (err as Error)?.message);
      await prisma.verificationCode.updateMany({
        where: { channel, target, purpose, consumedAt: null },
        data: { consumedAt: new Date() },
      });
      return NextResponse.json(
        { error: 'We could not send the SMS. Please check the number and try again.' },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, channel, expiresIn: EXPIRY_MINUTES * 60, delivered: true });
  } catch (err) {
    console.error('[OTP] request error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
