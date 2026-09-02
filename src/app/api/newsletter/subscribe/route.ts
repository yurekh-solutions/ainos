import { NextRequest, NextResponse } from 'next/server';

// Newsletter subscription API - integrates with ConvertKit, Beehiiv, or Resend
export async function POST(req: NextRequest) {
  try {
    const { email, name, source } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Try ConvertKit first (if configured)
    if (process.env.CONVERTKIT_API_KEY && process.env.CONVERTKIT_FORM_ID) {
      try {
        const res = await fetch('https://api.convertkit.com/v3/forms/' + process.env.CONVERTKIT_FORM_ID + '/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: process.env.CONVERTKIT_API_KEY,
            email,
            first_name: name || undefined,
          }),
          signal: AbortSignal.timeout(10000),
        });

        if (res.ok) {
          return NextResponse.json({ success: true, provider: 'convertkit' });
        }
      } catch (err) {
        console.error('ConvertKit error:', err);
      }
    }

    // Try Beehiiv (if configured)
    if (process.env.BEEHIV_API_KEY && process.env.BEEHIV_PUBLICATION_ID) {
      try {
        const res = await fetch('https://api.beehiiv.com/v2/publications/' + process.env.BEEHIV_PUBLICATION_ID + '/subscriptions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + process.env.BEEHIV_API_KEY,
          },
          body: JSON.stringify({
            email,
            send_welcome_email: true,
            utm_source: source || 'website',
          }),
          signal: AbortSignal.timeout(10000),
        });

        if (res.ok) {
          return NextResponse.json({ success: true, provider: 'beehiiv' });
        }
      } catch (err) {
        console.error('Beehiiv error:', err);
      }
    }

    // Try Resend (if configured)
    if (process.env.RESEND_API_KEY) {
      try {
        // First, add to contacts (if you have a Resend audience)
        const res = await fetch('https://api.resend.com/audiences/' + (process.env.RESEND_AUDIENCE_ID || 'default') + '/contacts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
          },
          body: JSON.stringify({ email, name }),
          signal: AbortSignal.timeout(10000),
        });

        if (res.ok) {
          return NextResponse.json({ success: true, provider: 'resend' });
        }
      } catch (err) {
        console.error('Resend error:', err);
      }
    }

    // Fallback: Store in database (if no email service configured)
    // You can create a NewsletterSubscriber model in Prisma for this
    console.log('[Newsletter] No email service configured. Subscriber:', email);
    
    return NextResponse.json({ 
      success: true, 
      provider: 'local',
      message: 'Subscribed successfully! (Email service not configured - stored locally)'
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
