// Exercises the real OTP + reset endpoints on the local dev server.
const BASE = 'http://localhost:3007';
const EMAIL = 'qa.otpflow@ainos-test.com';
const PHONE = '9876500011';

async function post(path, body) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let parsed;
  try { parsed = JSON.parse(text); } catch { parsed = text.slice(0, 200); }
  return { status: res.status, body: parsed };
}

(async () => {
  console.log('1) email OTP request  ->', JSON.stringify(await post('/api/auth/otp/request', {
    channel: 'email', target: EMAIL, purpose: 'signup',
  })));

  console.log('2) email OTP request (instant resend, expect 429) ->', JSON.stringify(await post('/api/auth/otp/request', {
    channel: 'email', target: EMAIL, purpose: 'signup',
  })));

  console.log('3) email OTP verify with wrong code ->', JSON.stringify(await post('/api/auth/otp/verify', {
    channel: 'email', target: EMAIL, purpose: 'signup', code: '000000',
  })));

  console.log('4) phone OTP request (no SMS provider in env) ->', JSON.stringify(await post('/api/auth/otp/request', {
    channel: 'phone', target: PHONE, purpose: 'signup',
  })));

  console.log('5) forgot-password for unknown email (enumeration-safe) ->', JSON.stringify(await post('/api/auth/forgot-password', {
    email: 'nobody-here@ainos-test.com',
  })));

  console.log('6) login with bad payload ->', JSON.stringify(await post('/api/auth/reset-password', {
    token: 'x', newPassword: 'short',
  })));
})();
