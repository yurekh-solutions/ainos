import { createHash, createHmac, randomInt, timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/prisma';

export type OtpChannel = 'email' | 'phone';
export type OtpPurpose = 'signup_email' | 'signup_phone' | 'reset_email';

export const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 45 * 1000;
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const MAX_ATTEMPTS = 5;
const PROOF_TTL_MS = 30 * 60 * 1000;

function secret(): string {
  return process.env.OTP_SECRET || process.env.NEXTAUTH_SECRET || 'ainos-dev-otp-secret';
}

/** Cryptographically random 6-digit code, zero padded. */
export function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

function hashCode(channel: OtpChannel, target: string, purpose: OtpPurpose, code: string): string {
  return createHash('sha256')
    .update(`${channel}:${target}:${purpose}:${code.trim()}:${secret()}`)
    .digest('hex');
}

export interface IssueResult {
  ok: boolean;
  code?: string;
  expiresAt?: Date;
  retryAfterSeconds?: number;
  error?: string;
}

/**
 * Creates a fresh code for the target and invalidates any earlier unused ones.
 * Rate limits: one send per 45s and at most 5 sends per hour per target.
 */
export async function issueOtp(params: {
  channel: OtpChannel;
  target: string;
  purpose: OtpPurpose;
  ipAddress?: string;
}): Promise<IssueResult> {
  const { channel, target, purpose, ipAddress } = params;
  const now = Date.now();

  const latest = await prisma.verificationCode.findFirst({
    where: { channel, target, purpose },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  if (latest) {
    const elapsed = now - latest.createdAt.getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      return {
        ok: false,
        retryAfterSeconds: Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000),
        error: 'Please wait before requesting another code.',
      };
    }
  }

  const recent = await prisma.verificationCode.count({
    where: { channel, target, purpose, createdAt: { gte: new Date(now - WINDOW_MS) } },
  });

  if (recent >= MAX_PER_WINDOW) {
    return {
      ok: false,
      retryAfterSeconds: Math.ceil(WINDOW_MS / 1000),
      error: 'Too many codes requested. Please try again later.',
    };
  }

  const code = generateOtp();
  const expiresAt = new Date(now + OTP_TTL_MS);

  // Invalidate earlier unused codes so only the newest one can be used.
  await prisma.verificationCode.updateMany({
    where: { channel, target, purpose, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  await prisma.verificationCode.create({
    data: {
      channel,
      target,
      purpose,
      codeHash: hashCode(channel, target, purpose, code),
      expiresAt,
      ipAddress: ipAddress || null,
    },
  });

  return { ok: true, code, expiresAt };
}

export interface ConsumeResult {
  ok: boolean;
  error?: string;
}

/** Verifies a submitted code and burns it so it cannot be replayed. */
export async function consumeOtp(params: {
  channel: OtpChannel;
  target: string;
  purpose: OtpPurpose;
  code: string;
}): Promise<ConsumeResult> {
  const { channel, target, purpose } = params;
  const code = (params.code || '').replace(/[^\d]/g, '');

  if (code.length !== 6) {
    return { ok: false, error: 'Enter the 6-digit code.' };
  }

  const row = await prisma.verificationCode.findFirst({
    where: { channel, target, purpose, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });

  if (!row) {
    return { ok: false, error: 'This code has expired. Please request a new one.' };
  }

  if (row.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: 'Too many incorrect attempts. Please request a new code.' };
  }

  const expected = Buffer.from(row.codeHash, 'hex');
  const actual = Buffer.from(hashCode(channel, target, purpose, code), 'hex');
  const matches = expected.length === actual.length && timingSafeEqual(expected, actual);

  if (!matches) {
    await prisma.verificationCode.update({
      where: { id: row.id },
      data: { attempts: { increment: 1 } },
    });
    const left = MAX_ATTEMPTS - (row.attempts + 1);
    return {
      ok: false,
      error: left > 0 ? `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} left.` : 'Too many incorrect attempts. Please request a new code.',
    };
  }

  await prisma.verificationCode.update({ where: { id: row.id }, data: { consumedAt: new Date() } });
  return { ok: true };
}

// ─── Signed proof tokens ─────────────────────────────────────────────────────
// A verified OTP is summarised as "channel:target was verified for purpose".
// The signup API requires this proof, so a client cannot skip verification by
// simply not calling the OTP endpoints.

export interface VerificationProof {
  channel: OtpChannel;
  target: string;
  purpose: OtpPurpose;
  exp: number;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function createVerificationProof(proof: Omit<VerificationProof, 'exp'>): string {
  const payload: VerificationProof = { ...proof, exp: Date.now() + PROOF_TTL_MS };
  const body = base64url(JSON.stringify(payload));
  const signature = base64url(createHmac('sha256', secret()).update(body).digest());
  return `${body}.${signature}`;
}

export function readVerificationProof(token: string | undefined | null): VerificationProof | null {
  if (!token || typeof token !== 'string') return null;
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;

  const expected = base64url(createHmac('sha256', secret()).update(body).digest());
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64').toString()) as VerificationProof;
    if (!payload?.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Throttles password-reset requests without storing an extra table. */
export async function isResetThrottled(target: string): Promise<boolean> {
  const since = new Date(Date.now() - 15 * 60 * 1000);
  const count = await prisma.verificationCode.count({
    where: { channel: 'email', target, purpose: 'reset_email', createdAt: { gte: since } },
  });
  return count >= 3;
}

export async function markResetRequested(target: string): Promise<void> {
  await prisma.verificationCode.create({
    data: {
      channel: 'email',
      target,
      purpose: 'reset_email',
      codeHash: '',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      consumedAt: new Date(),
    },
  });
}
