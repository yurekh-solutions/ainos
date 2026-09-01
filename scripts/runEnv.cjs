const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
for (const line of env.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"]*)"?\s*$/);
  if (m) process.env[m[1]] = m[2];
}
console.log('Loaded. Keys:', (process.env.GEMINI_API_KEYS || '').split(',').filter(Boolean).length, 'Model:', process.env.GEMINI_MODEL);

const { execSync } = require('child_process');
const args = process.argv.slice(2);
try {
  execSync('npx tsx scripts/runPending2.ts ' + args.join(' '), {
    stdio: 'inherit',
    env: process.env,
    shell: true
  });
} catch (e) {
  process.exit(1);
}
