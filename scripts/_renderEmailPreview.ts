/**
 * Renders the auth mail templates to standalone HTML files for a quick visual
 * check without sending a real message.
 *
 *   npx tsx scripts/_renderEmailPreview.ts
 */
import { writeFileSync } from 'fs';
import { join } from 'path';
import { otpEmailTemplate, passwordResetEmailTemplate } from '../src/lib/email';

const outDir = join(process.cwd(), 'scripts');
const resetUrl = 'http://localhost:3000/auth/reset-password?token=preview';

const resetHtml = passwordResetEmailTemplate(resetUrl);
const otpHtml = otpEmailTemplate({
  code: '482913',
  heading: 'Verify your email',
  intro: 'Enter this code in the AINOS sign-up form to confirm your email address.',
  expiryMinutes: 10,
});

writeFileSync(join(outDir, 'email-preview-reset.html'), resetHtml);
writeFileSync(join(outDir, 'email-preview-otp.html'), otpHtml);

const logo = resetHtml.match(/<img src="([^"]+)"[^>]*>/);
console.log('reset preview  scripts/email-preview-reset.html');
console.log('otp preview    scripts/email-preview-otp.html');
console.log('logo tag       ', logo?.[0] ?? 'NOT FOUND');
