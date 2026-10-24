/* Find (and optionally kill) the process listening on a TCP port. */
const { execFileSync } = require('child_process');

const port = process.argv[2] || '3000';
const shouldKill = process.argv.includes('--kill');

const out = execFileSync('netstat', ['-ano', '-p', 'tcp'], { encoding: 'utf8' });
const pids = new Set();

for (const line of out.split(/\r?\n/)) {
  if (!line.includes('LISTENING')) continue;
  const cols = line.trim().split(/\s+/);
  const local = cols[1] || '';
  if (!local.endsWith(':' + port)) continue;
  const pid = cols[cols.length - 1];
  if (/^\d+$/.test(pid)) pids.add(pid);
}

if (pids.size === 0) {
  console.log(`no listener on ${port}`);
  process.exit(0);
}

console.log(`listener pids on ${port}: ${[...pids].join(', ')}`);

if (shouldKill) {
  for (const pid of pids) {
    try {
      execFileSync('taskkill', ['/F', '/T', '/PID', pid], { stdio: 'inherit' });
      console.log(`killed ${pid}`);
    } catch (error) {
      console.log(`could not kill ${pid}: ${error.message}`);
    }
  }
}
