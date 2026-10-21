/**
 * Transactional email via Brevo (formerly Sendinblue).
 * Free tier: 300 emails/day, no domain verification required for small volumes.
 * Better deliverability than Firebase's unverified sender domain.
 */

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from }: SendEmailOptions): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error('BREVO_API_KEY not set. Add it to Render Environment Variables.');
  }

  const sender = from || process.env.BREVO_FROM || 'AINOS <noreply@ainos-ywu0.onrender.com>';

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'AINOS', email: sender.split('<')[1]?.replace('>', '') || 'noreply@ainos-ywu0.onrender.com' },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Brevo API returned ${res.status}`);
  }
}

/**
 * Password reset email template.
 */
export function passwordResetEmailTemplate(resetUrl: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; background: #f8f7fc;">
      <div style="background: white; border-radius: 16px; padding: 40px 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%); border-radius: 16px; display: flex; align-items: center; justify-content: center;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">Reset Your Password</h1>
          <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">You requested a password reset for your AINOS account.</p>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px;">Reset Password</a>
        </div>

        <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.6;">
            <strong style="color: #111827;">Link expires in 1 hour.</strong><br>
            If you didn't request this, you can safely ignore this email. Your password will remain unchanged.
          </p>
        </div>

        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">
            AINOS Business Suite<br>
            Billing, accounts and marketing for your business.
          </p>
        </div>
      </div>
    </div>
  `;
}
