// Test registration with welcome email
async function testRegistration() {
  console.log('Testing registration with welcome email...\n');
  
  const testData = {
    name: 'Test User',
    email: 'test' + Date.now() + '@example.com', // Unique email to avoid duplicate
    phone: '9876543210',
    password: 'testpass123',
    companyName: 'Test Company',
    companyType: 'retail',
    companyEmail: 'test@example.com',
    companyPhone: '9876543210',
    companyAddress: 'Test Address',
    country: 'India',
  };

  try {
    const res = await fetch('http://localhost:3003/api/auth/register-company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData),
    });

    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}
testRegistration();
