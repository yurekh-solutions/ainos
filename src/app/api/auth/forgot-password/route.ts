import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    if (!user) {
      return NextResponse.json({ message: 'If an account exists with that email, a reset code has been sent.' });
    }

    if (!user.password) {
      return NextResponse.json({ error: 'This account uses Google sign-in. Please sign in with Google.' }, { status: 400 });
    }

    const otp = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: otp, resetTokenExpiry: expiry },
    });

    // Send OTP via Gmail SMTP — works for ANY recipient email
    try {
      await sendEmail({
        to: user.email,
        subject: 'AINOS — Password Reset Code',
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
            <h2 style="color:#4c1d95;margin-bottom:16px;">Password Reset Request</h2>
            <p style="color:#374151;line-height:1.6;">You requested a password reset for your AINOS account. Use the code below:</p>
            <div style="background:#f3f0ff;border:2px solid #4c1d95;border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
              <p style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0;">Your Reset Code</p>
              <p style="font-size:36px;font-weight:700;color:#4c1d95;letter-spacing:8px;margin:0;font-family:monospace;">${otp}</p>
            </div>
            <p style="color:#374151;line-height:1.6;">This code expires in <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
            <p style="color:#9ca3af;font-size:13px;">— AINOS Business Suite</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('[Email] Failed to send reset email:', emailErr);
      // Still return success — don't reveal email send failure
    }

    return NextResponse.json({
      message: 'If an account exists with that email, a reset code has been sent.',
    });
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
