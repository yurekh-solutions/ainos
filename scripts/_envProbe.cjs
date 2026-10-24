const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const wanted = /NEXTAUTH|BREVO|BASE_PATH|BASE_URL|SMS|TWILIO|MSG91|OTP|FIREBASE|RESEND/i;
for (const f of ['.env', '.env.local']) {
  const p = path.join(root, f);
  if (!fs.existsSync(p)) { console.log(f, 'MISSING'); continue; }
  const t = fs.readFileSync(p, 'utf8');
  console.log('=== ' + f);
  for (const line of t.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_]+)\s*=(.*)$/);
    if (!m) continue;
    if (!wanted.test(m[1])) continue;
    const v = m[2].trim();
    console.log(m[1], '=>', v ? 'SET(len=' + v.length + ')' : 'EMPTY');
  }
}
