// Check Brevo email delivery logs
async function checkBrevoLogs() {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.log('BREVO_API_KEY not set');
    return;
  }

  console.log('Checking Brevo email logs...\n');

  // Check sent emails
  const res = await fetch('https://api.brevo.com/v3/smtp/email?limit=10&sort=desc', {
    headers: { 'api-key': apiKey },
  });

  console.log('Status:', res.status);
  const data = await res.json();

  if (data.emails && data.emails.length > 0) {
    console.log(`Found ${data.emails.length} recent emails:\n`);
    data.emails.forEach((email, i) => {
      console.log(`${i + 1}. To: ${email.to}`);
      console.log(`   Subject: ${email.subject}`);
      console.log(`   Status: ${email.status}`);
      console.log(`   Date: ${email.date}`);
      console.log('');
    });
  } else {
    console.log('No emails found');
    console.log('Response:', JSON.stringify(data, null, 2));
  }
}
checkBrevoLogs();
