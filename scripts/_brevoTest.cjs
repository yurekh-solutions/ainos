// Quick Brevo delivery check — sends one real email to the verified owner.
// Run: node scripts/_brevoTest.cjs
const fs = require('fs');
const path = require('path');

function readEnv() {
  const out = {};
  for (const f of ['.env.local', '.env']) {
    const p = path.join(__dirname, '..', f);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i);
      if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
  return out;
}

(async () => {
  const env = readEnv();
  const key = env.BREVO_API_KEY;
  const from = env.BREVO_FROM || env.EMAIL_FROM || 'yurekhsolutions@gmail.com';
  const to = 'yurekhsolutions@gmail.com';
  if (!key) { console.log('❌ BREVO_API_KEY not found in .env.local/.env'); process.exit(1); }

  console.log('Sending test via Brevo →', to, '(from', from + ')');
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: { name: 'AINOS', email: from },
      to: [{ email: to }],
      subject: 'AINOS Brevo delivery check',
      htmlContent: '<div style="font-family:Arial,sans-serif;padding:24px"><h2>Brevo is working ✅</h2><p>This is a live delivery test from the AINOS email service.</p></div>',
    }),
  });
  const text = await res.text();
  console.log('HTTP', res.status, text);
  console.log(res.ok ? '✅ Brevo accepted the email — check the inbox.' : '❌ Brevo rejected — see message above.');
})();
