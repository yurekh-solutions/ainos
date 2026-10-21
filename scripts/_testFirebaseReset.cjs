(async () => {
  const res = await fetch('https://ainos-ywu0.onrender.com/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'yurekhsolutions@gmail.com' }),
  });
  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Body:', JSON.stringify(data, null, 2));
})();
