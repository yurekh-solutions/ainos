import { spawnSync } from 'child_process';
const cwd = 'c:\\Users\\yurek\\OneDrive\\Desktop\\yuvraj\\ainos';
function run(cmd, args) {
  console.log(`> ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', stdio: 'inherit' });
  if (r.status !== 0) console.log('Exit code:', r.status);
  return r;
}
run('git', ['add', '-A']);
run('git', ['commit', '-m', 'Remove duplicate bell/avatar from Blog Agent header, keep Connect Website button']);
run('git', ['push', 'origin', 'main']);
