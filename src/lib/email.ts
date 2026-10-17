import nodemailer from 'nodemailer';

// Gmail SMTP transporter — sends from your Gmail to ANY recipient
// No domain verification needed. Just needs a Gmail App Password.
function getTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error('SMTP_USER and SMTP_APP_PASSWORD must be set in .env.local');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  const transporter = getTransporter();
  const from = process.env.SMTP_USER;

  const info = await transporter.sendMail({
    from: `"AINOS" <${from}>`,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  return info;
}
