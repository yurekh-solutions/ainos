/**
 * SMS delivery for phone OTPs.
 *
 * Providers are selected with SMS_PROVIDER and configured purely through env
 * vars, so swapping providers never touches calling code:
 *   msg91      → MSG91_AUTH_KEY, MSG91_TEMPLATE_ID
 *   fast2sms   → FAST2SMS_API_KEY
 *   twilio     → TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM
 *
 * `phone` is always the normalised form (country code + digits, no "+").
 */

export type SmsProvider = 'msg91' | 'fast2sms' | 'twilio';

export function smsProvider(): SmsProvider | null {
  const configured = (process.env.SMS_PROVIDER || '').toLowerCase();

  const ready: Record<SmsProvider, boolean> = {
    msg91: Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID),
    fast2sms: Boolean(process.env.FAST2SMS_API_KEY),
    twilio: Boolean(
      process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM,
    ),
  };

  if (configured === 'msg91' && process.env.MSG91_AUTH_KEY) return 'msg91';
  if (configured === 'fast2sms' && process.env.FAST2SMS_API_KEY) return 'fast2sms';
  if (configured === 'twilio' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) return 'twilio';

  // No explicit choice: use whichever provider actually has credentials, so
  // pasting a key is enough to switch phone OTP on.
  if (ready.msg91) return 'msg91';
  if (ready.fast2sms) return 'fast2sms';
  if (ready.twilio) return 'twilio';
  return null;
}

export function smsConfigured(): boolean {
  return smsProvider() !== null;
}

async function sendMsg91(phone: string, code: string): Promise<void> {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;
  if (!authKey || !templateId) throw new Error('MSG91_AUTH_KEY / MSG91_TEMPLATE_ID not set');

  const url = new URL('https://control.msg91.com/api/v5/otp');
  url.searchParams.set('template_id', templateId);
  url.searchParams.set('mobile', phone);
  url.searchParams.set('otp', code);

  const res = await fetch(url, {
    method: 'POST',
    headers: { authkey: authKey, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(15000),
  });

  const data = (await res.json().catch(() => ({}))) as { type?: string; message?: string };
  if (!res.ok || data.type === 'error') {
    throw new Error(data.message || `MSG91 returned ${res.status}`);
  }
}

async function sendFast2Sms(phone: string, code: string): Promise<void> {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) throw new Error('FAST2SMS_API_KEY not set');

  const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: { authorization: apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      route: 'otp',
      variables_values: code,
      numbers: phone.slice(-10),
      flash: 0,
    }),
    signal: AbortSignal.timeout(15000),
  });

  const data = (await res.json().catch(() => ({}))) as { return?: boolean; message?: string | string[] };
  if (!res.ok || data.return === false) {
    const message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
    throw new Error(message || `Fast2SMS returned ${res.status}`);
  }
}

async function sendTwilio(phone: string, code: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!sid || !token || !from) throw new Error('Twilio credentials not set');

  const body = new URLSearchParams({
    To: `+${phone}`,
    From: from,
    Body: `${code} is your AINOS verification code. It expires in 10 minutes.`,
  });

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message || `Twilio returned ${res.status}`);
  }
}

/** Sends the OTP text. Throws with a readable reason when delivery fails. */
export async function sendSmsOtp(phone: string, code: string): Promise<void> {
  const provider = smsProvider();
  if (provider === 'msg91') return sendMsg91(phone, code);
  if (provider === 'fast2sms') return sendFast2Sms(phone, code);
  if (provider === 'twilio') return sendTwilio(phone, code);
  throw new Error('SMS provider not configured');
}
