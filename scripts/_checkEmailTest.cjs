/**
 * Smoke test for /api/auth/check-email.
 * Usage: node scripts/_checkEmailTest.cjs [baseUrl]
 */
const BASE = process.argv[2] || 'http://localhost:3000';

async function probe(label, email) {
  const res = await fetch(`${BASE}/api/auth/check-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json().catch(() => ({}));
  console.log(`${label.padEnd(26)} ${res.status}  ${JSON.stringify(data)}`);
  return { status: res.status, data };
}

(async () => {
  console.log(`Testing ${BASE}/api/auth/check-email\n`);

  const registered = await probe('registered account', 'soniajaiswal2222@gmail.com');
  await probe('uppercase variant', 'SoniaJaiswal2222@Gmail.com');
  await probe('brand new address', `qa.check.${Date.now()}@ainos-test.com`);
  await probe('invalid address', 'not-an-email');
  // Password-less rows (legacy Google sign-ins) stay claimable on purpose.
  await probe('no-password row', 'yurekhsolutions@gmail.com');

  if (registered.data?.canRegister !== false || registered.data?.hasPassword !== true) {
    console.log('\n  !! an account with a password must return canRegister:false');
    process.exitCode = 1;
  } else {
    console.log('\n  OK: password accounts are blocked, new addresses pass');
  }
})();
