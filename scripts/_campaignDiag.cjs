// Diagnose why a campaign send fails: reads the campaign from the DB and
// attempts a real Brevo send per recipient, printing the exact error.
// Run: node scripts/_campaignDiag.cjs [campaignId]
const fs = require('fs');
const path = require('path');

function readEnv() {
  const out = {};
  for (const f of ['.env.local', '.env']) {
    const p = path.join(__dirname, '..', f);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
  return out;
}

const env = readEnv();
process.env.DATABASE_URL = env.DATABASE_URL;
const BREVO = env.BREVO_API_KEY;
const FROM = env.BREVO_FROM || env.EMAIL_FROM || 'yurekhsolutions@gmail.com';

(async () => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const id = process.argv[2];

  const campaign = id
    ? await prisma.emailCampaign.findUnique({ where: { id } })
    : await prisma.emailCampaign.findFirst({ where: { status: 'failed' }, orderBy: { createdAt: 'desc' } });

  if (!campaign) { console.log('No campaign found.'); await prisma.$disconnect(); return; }

  console.log('Campaign:', campaign.id, '|', campaign.name);
  console.log('Status:', campaign.status, '| sentCount:', campaign.sentCount);
  console.log('Recipients raw:', JSON.stringify(campaign.recipients));
  const recipients = Array.isArray(campaign.recipients) ? campaign.recipients : [];
  const valid = recipients.flatMap((r) => String(r).split(/[\s,;]+/)).map((e) => e.trim()).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  console.log('Valid recipients:', JSON.stringify(valid));

  if (!BREVO) { console.log('❌ BREVO_API_KEY missing'); await prisma.$disconnect(); return; }

  for (const to of valid) {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'AINOS', email: FROM },
        to: [{ email: to }],
        subject: '[diag] ' + (campaign.subject || campaign.name),
        htmlContent: campaign.content || '(empty)',
      }),
    });
    const body = await res.text();
    console.log(`-> ${to}: HTTP ${res.status} ${body}`);
  }

  await prisma.$disconnect();
})().catch((e) => { console.error('DIAG ERROR:', e); process.exit(1); });
