import { prisma } from './prisma';
import { sendEmail, brandLogoUrl, isEmailConfigured } from './email';

// Shared campaign email sender. Used by BOTH the /marketing/campaigns workspace
// (via /api/email-campaigns) and the Tool Marketplace "email-campaign-sender"
// handler, so the two surfaces can never diverge on how a bulk email is built
// or delivered. Transport is the app's own sendEmail util (Brevo / SMTP) — no
// separate vendor dependency.

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ));
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Normalize recipients: split on comma / semicolon / whitespace / newline so
 * emails pasted space-separated (or one-per-line) don't collapse into a single
 * invalid address, then keep only well-formed addresses.
 */
export function parseRecipients(raw: Array<string | number>): string[] {
  return raw
    .flatMap((r) => String(r).split(/[\s,;]+/))
    .map((e) => e.trim())
    .filter((e) => EMAIL_RE.test(e));
}

/** Branded HTML wrapper — mirrors the preview shown in the campaigns UI. */
export function campaignHtml(subject: string, body: string): string {
  return (
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">` +
    `<img src="${brandLogoUrl()}" width="56" alt="AINOS" style="display:block;width:56px;height:auto;margin:0 auto 20px;border:0;outline:none;text-decoration:none" />` +
    `<h2 style="color:#111827">${escapeHtml(subject)}</h2>` +
    `<p style="white-space:pre-wrap;line-height:1.6;color:#374151">${escapeHtml(body)}</p>` +
    `<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />` +
    `<p style="font-size:12px;color:#9ca3af">Sent via AINOS Business Suite</p></div>`
  );
}

export interface CampaignSendResult {
  total: number;
  sent: number;
  failed: number;
  failures: string[];
}

/**
 * Send one campaign email to every recipient via the shared sendEmail util.
 * Throws up-front if no email transport is configured, so callers surface a
 * clear message instead of a silent "sent" that never left the building.
 */
export async function sendCampaignEmails(opts: {
  subject: string;
  content: string;
  recipients: string[];
}): Promise<CampaignSendResult> {
  if (!isEmailConfigured()) {
    throw new Error('Email service is not configured. Set BREVO_API_KEY (or SMTP credentials) to send campaigns.');
  }

  const html = campaignHtml(opts.subject, opts.content);
  const emails = parseRecipients(opts.recipients);

  let sent = 0;
  let failed = 0;
  const failures: string[] = [];

  await Promise.all(
    emails.map(async (to) => {
      try {
        await sendEmail({ to, subject: opts.subject, html });
        sent++;
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : 'send error';
        failures.push(`${to} (${msg})`);
      }
    })
  );

  return { total: emails.length, sent, failed, failures };
}

/**
 * Send a stored campaign by id: reads it, delivers to its recipients, and
 * updates the row with the real outcome. Ownership must be checked by the
 * caller (route) before invoking this.
 */
export async function deliverCampaign(campaignId: string): Promise<CampaignSendResult> {
  const campaign = await prisma.emailCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new Error('Campaign not found');

  const recipients = Array.isArray(campaign.recipients) ? (campaign.recipients as string[]) : [];
  if (!recipients.length) throw new Error('Add at least one recipient before sending.');

  const result = await sendCampaignEmails({
    subject: campaign.subject || campaign.name,
    content: campaign.content || '',
    recipients,
  });

  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: {
      status: result.sent > 0 ? 'sent' : 'failed',
      sentCount: result.sent,
      sentAt: result.sent > 0 ? new Date() : null,
    },
  });

  return result;
}
