/**
 * Transactional email for AINOS.
 *
 * Transport priority:
 *   1. SMTP (Gmail app password or any SMTP host) — best inbox placement and
 *      works without owning a domain, so this is what production should use.
 *   2. Brevo REST API — free tier, no DNS verification required.
 *
 * Set SMTP_USER + SMTP_APP_PASSWORD (or GMAIL_USER + GMAIL_APP_PASSWORD) to
 * switch to SMTP without touching any call site.
 */

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

function smtpCredentials(): { user: string; pass: string } | null {
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  // Google shows app passwords grouped in 4s — strip the spaces.
  return { user, pass: pass.replace(/\s+/g, '') };
}

/**
 * Only a domain verified in the provider may appear in the From header.
 * Sending as an unverified domain (the old `noreply@<render-host>` default)
 * is silently dropped, which is exactly why reset and OTP mails never arrived.
 * EMAIL_FROM wins; otherwise the SMTP account, then the Brevo-verified sender.
 */
function defaultFrom(): string {
  const explicit = process.env.EMAIL_FROM || process.env.BREVO_FROM || process.env.BREVO_SENDER_EMAIL;
  if (explicit) return explicit.includes('<') ? explicit : `AINOS <${explicit}>`;

  const smtp = smtpCredentials();
  if (smtp) return `AINOS <${smtp.user}>`;

  return 'AINOS <yurekhsolutions@gmail.com>';
}

function senderEmail(from: string): string {
  return from.match(/<([^>]+)>/)?.[1]?.trim() || from.trim();
}

/**
 * Mail clients have no site context, so the brand mark needs an absolute URL.
 * Callers that already know the host (the reset link) pass it in; otherwise we
 * fall back to the configured app URL and finally to production.
 */
function brandLogoUrl(origin?: string): string {
  const base = (
    origin ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL_BASE ||
    process.env.NEXTAUTH_URL ||
    'https://ainos-ywu0.onrender.com'
  ).replace(/\/+$/, '');
  return `${base}/ainos-wordmark.png`;
}

async function sendViaSmtp({ to, subject, html, from }: SendEmailOptions): Promise<void> {
  const credentials = smtpCredentials();
  if (!credentials) throw new Error('SMTP credentials missing');

  const port = Number(process.env.SMTP_PORT || 465);
  const { default: nodemailer } = await import('nodemailer');
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: credentials,
  });

  const info = await transport.sendMail({
    from: from || defaultFrom(),
    to,
    subject,
    html,
  });
  console.log('[Email] SMTP accepted', info.messageId, '->', to);
}

async function sendViaBrevo({ to, subject, html, from }: SendEmailOptions): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error(
      'No email transport configured. Add SMTP_USER + SMTP_APP_PASSWORD (recommended) or BREVO_API_KEY.',
    );
  }

  const sender = from || defaultFrom();

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'AINOS', email: senderEmail(sender) },
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

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  if (smtpCredentials()) {
    await sendViaSmtp(options);
    return;
  }
  await sendViaBrevo(options);
}

/**
 * 6-digit verification code email (signup + password reset).
 */
export function otpEmailTemplate({ code, heading, intro, expiryMinutes }: {
  code: string;
  heading: string;
  intro: string;
  expiryMinutes: number;
}): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; background: #f8f7fc;">
      <div style="background: white; border-radius: 16px; padding: 40px 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        <div style="text-align: center; margin-bottom: 28px;">
          <img src="${brandLogoUrl()}" width="140" alt="AINOS" style="display: block; width: 140px; height: auto; margin: 0 auto 16px; border: 0; outline: none; text-decoration: none;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #111827;">${heading}</h1>
          <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">${intro}</p>
        </div>

        <div style="background: #f8f7fc; border: 1px solid #e9e5f5; border-radius: 12px; padding: 22px; text-align: center; margin: 24px 0;">
          <p style="margin: 0 0 6px; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: #6b7280;">Your verification code</p>
          <p style="margin: 0; font-size: 34px; font-weight: 700; letter-spacing: 0.32em; color: #4c1d95; font-family: 'SFMono-Regular', Menlo, Consolas, monospace;">${code}</p>
        </div>

        <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.6;">
            <strong style="color: #111827;">Expires in ${expiryMinutes} minutes.</strong><br>
            If you didn't request this code, you can safely ignore this email.
          </p>
        </div>

        <div style="text-align: center; margin-top: 28px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">
            AINOS Business Suite<br>
            Billing, accounts and marketing for your business.
          </p>
        </div>
      </div>
    </div>
  `;
}


/**
 * Password reset email template.
 */
export function passwordResetEmailTemplate(resetUrl: string): string {
  // Reuse the reset link's host so the logo always loads from the deployment
  // the user is actually on (localhost, Render, custom domain, preview).
  let origin: string | undefined;
  try { origin = new URL(resetUrl).origin; } catch { origin = undefined; }

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; background: #f8f7fc;">
      <div style="background: white; border-radius: 16px; padding: 40px 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        <div style="text-align: center; margin-bottom: 32px;">
          <img src="${brandLogoUrl(origin)}" width="148" alt="AINOS" style="display: block; width: 148px; height: auto; margin: 0 auto 18px; border: 0; outline: none; text-decoration: none;">
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

/**
 * Welcome email template for new registrations.
 */
export function welcomeEmailTemplate(userName: string, companyName: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; background: #f8f7fc;">
      <div style="background: white; border-radius: 16px; padding: 40px 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%); border-radius: 16px; display: flex; align-items: center; justify-content: center;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">Welcome to AINOS!</h1>
          <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">Your account has been created successfully.</p>
        </div>

        <div style="margin: 24px 0;">
          <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
            Hi <strong>${userName}</strong>,
          </p>
          <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
            Your company <strong>${companyName}</strong> has been registered on AINOS Business Suite. We're excited to have you on board!
          </p>
          <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
            <strong>What's next?</strong>
          </p>
          <ul style="margin: 0 0 16px; padding-left: 20px; font-size: 14px; color: #374151; line-height: 1.8;">
            <li>Complete your company profile</li>
            <li>Upload required documents for verification</li>
            <li>Explore our business tools and features</li>
            <li>Get 100 welcome credits to start with</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/signin" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px;">Sign In to AINOS</a>
        </div>

        <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.6;">
            <strong style="color: #111827;">Need help?</strong><br>
            Our admin team will review your registration and approve your account shortly. You'll receive a notification once approved.
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
