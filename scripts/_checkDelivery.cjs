// Check Brevo email delivery status
async function checkDelivery() {
  const apiKey = process.env.BREVO_API_KEY;
  console.log('Checking Brevo delivery logs...\n');

  // Check recent sent emails
  const res = await fetch('https://api.brevo.com/v3/smtp/email?limit=5&sort=desc', {
    headers: { 'api-key': apiKey },
  });

  console.log('Status:', res.status);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
checkDelivery();
