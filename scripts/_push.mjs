import { spawnSync } from 'child_process';
const cwd = 'c:\\Users\\yurek\\OneDrive\\Desktop\\yuvraj\\ainos';
function run(cmd, args) {
  console.log(`> ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', stdio: 'inherit' });
  if (r.status !== 0) console.log('Exit code:', r.status);
  return r;
}
run('git', ['add', '-A']);
run('git', ['commit', '-m', 'Add markdown image rendering to embed widget, blog publisher, and dashboard blog reader']);
run('git', ['push', 'origin', 'main']);
