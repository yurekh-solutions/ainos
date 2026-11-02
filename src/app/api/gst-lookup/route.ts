import { NextRequest, NextResponse } from 'next/server';

// GST Scraper - Self-hosted Flask server on Render
// Flow: getCaptcha → user solves captcha → verifyGST → real data
const FLASK_URL = process.env.GST_SCRAPER_URL || 'https://ainos-gst-scraper.onrender.com';

// API-key GSTIN provider (gstinapi.in) — no captcha, no scraper, no GSTN hang.
// When GSTIN_API_KEY is set, the register flow uses this reliable path first
// and only falls back to the captcha scraper when no key is configured.
const GSTIN_API_KEY = process.env.GSTIN_API_KEY || '';
const GSTIN_API_BASE = process.env.GSTIN_API_BASE || 'https://www.gstinapi.in';
const GSTIN_FORMAT = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const STATE_CODES: Record<string, string> = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
  '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi',
  '08': 'Rajasthan', '09': 'Uttar Pradesh', '10': 'Bihar', '11': 'Sikkim',
  '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
  '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal',
  '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh',
  '24': 'Gujarat', '26': 'Dadra & Nagar Haveli', '27': 'Maharashtra',
  '28': 'Andhra Pradesh', '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep',
  '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry',
  '35': 'Andaman & Nicobar', '36': 'Telangana', '37': 'Andhra Pradesh', '38': 'Ladakh',
};

const PAN_ENTITY: Record<string, string> = {
  'A': 'proprietorship', 'B': 'partnership', 'C': 'pvt_ltd',
  'F': 'llp', 'G': 'government', 'H': 'huf', 'J': 'artificial',
  'L': 'public_ltd', 'P': 'partnership', 'T': 'trust',
};

// Server-side retry: attempt fetch up to N times with delay between attempts
// Handles transient 502/503 from Render cold starts or GSTN portal hiccups
async function fetchWithRetry(url: string, options: RequestInit, retries = 3, delayMs = 3000): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      // 502/503 = transient — retry. 4xx = client error — don't retry.
      if (res.status >= 500 && i < retries - 1) {
        console.warn(`[GST] Attempt ${i + 1}/${retries} returned ${res.status}, retrying in ${delayMs}ms...`);
        await new Promise(r => setTimeout(r, delayMs));
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (i < retries - 1) {
        console.warn(`[GST] Attempt ${i + 1}/${retries} failed (${(err as Error).message}), retrying in ${delayMs}ms...`);
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
  }
  throw lastErr || new Error('All retry attempts exhausted');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // Action 1: Get captcha for GST verification
    if (action === 'getCaptcha') {
      const { gstNumber } = body;
      if (!gstNumber || gstNumber.length !== 15) {
        return NextResponse.json({ error: 'Invalid GST number' }, { status: 400 });
      }

      try {
        const res = await fetchWithRetry(
          `${FLASK_URL}/api/v1/getCaptcha`,
          { signal: AbortSignal.timeout(60000) },
          3, // 3 attempts
          4000 // 4s between attempts (covers cold start)
        );
        if (!res.ok) {
          console.error(`[GST] Captcha failed after retries: ${res.status}`);
          return NextResponse.json({
            error: 'GST portal is temporarily unavailable. Please try again in a few seconds.',
            retryable: true,
          }, { status: 502 });
        }
        const data = await res.json();
        return NextResponse.json({
          success: true,
          sessionId: data.sessionId,
          captchaImage: data.image,
          gstNumber: gstNumber.toUpperCase().trim(),
        });
      } catch (err) {
        console.error('[GST] Captcha error:', err);
        return NextResponse.json({
          error: 'Unable to connect to GST service. Please try again.',
          retryable: true,
        }, { status: 503 });
      }
    }

    // Action 2: Verify GST with captcha solution
    if (action === 'verifyGST') {
      const { sessionId, gstNumber, captchaText } = body;
      if (!sessionId || !gstNumber || !captchaText) {
        return NextResponse.json({ error: 'Missing sessionId, gstNumber, or captchaText' }, { status: 400 });
      }

      try {
        const res = await fetchWithRetry(
          `${FLASK_URL}/api/v1/getGSTDetails`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              GSTIN: gstNumber.toUpperCase().trim(),
              captcha: captchaText.trim(),
            }),
            signal: AbortSignal.timeout(30000),
          },
          2, // 2 attempts for verify (session may expire)
          3000
        );

        if (!res.ok) {
          return NextResponse.json({
            error: 'GST verification failed. The GSTN portal may be busy. Please try again.',
            retryable: true,
          }, { status: 502 });
        }

        const data = await res.json();

        // Check if GSTN returned an error
        if (data.error || data?.status === 'error') {
          return NextResponse.json({
            error: data.error || 'GST verification failed. Please try again.',
            gstError: true,
          });
        }

        // Parse real GST data from GSTN portal
        const gst = gstNumber.toUpperCase().trim();
        const stateCode = gst.slice(0, 2);
        const pan = gst.slice(2, 12);

        const STATE_CODES: Record<string, string> = {
          '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
          '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi',
          '08': 'Rajasthan', '09': 'Uttar Pradesh', '10': 'Bihar', '11': 'Sikkim',
          '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
          '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal',
          '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh',
          '24': 'Gujarat', '26': 'Dadra & Nagar Haveli', '27': 'Maharashtra',
          '28': 'Andhra Pradesh', '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep',
          '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry',
          '35': 'Andaman & Nicobar', '36': 'Telangana', '37': 'Andhra Pradesh', '38': 'Ladakh',
        };

        const PAN_ENTITY: Record<string, string> = {
          'A': 'proprietorship', 'B': 'partnership', 'C': 'pvt_ltd',
          'F': 'llp', 'G': 'government', 'H': 'huf', 'J': 'artificial',
          'L': 'public_ltd', 'P': 'partnership', 'T': 'trust',
        };

        const addr = data.pradr?.adr || '';
        const stateName = STATE_CODES[stateCode] || 'Unknown';
        const realEntityType = data.nba || data.ctb || '';
        const entityTypeMap: Record<string, string> = {
          'Proprietorship': 'proprietorship',
          'Partnership': 'partnership',
          'Limited Liability Partnership': 'llp',
          'Private Limited Company': 'pvt_ltd',
          'Public Limited Company': 'public_ltd',
          'Trust': 'trust',
        };
        const entityType = entityTypeMap[realEntityType] || PAN_ENTITY[pan.charAt(3)] || 'proprietorship';

        // Registration status lives in different shapes depending on the GSTN
        // endpoint version: a top-level `sts`, or — most commonly for the
        // taxpayerDetails search — the latest `registrations[].stst` entry.
        const readGstStatus = (d: Record<string, unknown>): string | null => {
          const top = d?.sts ?? d?.stst;
          if (typeof top === 'string' && top.trim()) return top.trim();
          const regs = Array.isArray(d?.registrations) ? (d.registrations as Record<string, unknown>[]) : [];
          for (let i = regs.length - 1; i >= 0; i--) {
            const s = regs[i]?.stst;
            if (typeof s === 'string' && s.trim()) return s.trim();
          }
          return null;
        };

        return NextResponse.json({
          success: true,
          source: 'gstn-portal',
          gstNumber: gst,
          pan,
          stateName,
          entityType,
          companyName: data.lgnm || null,
          tradeName: data.tradeNam || null,
          address: addr || null,
          legalName: data.lgnm || null,
          registrationDate: data.rgdt || null,
          constitution: data.ctb || data.ctj || null,
          natureOfBusiness: Array.isArray(data.nba) ? data.nba.join(', ') : (data.nba || null),
          gstStatus: readGstStatus(data),
          taxpayerType: data.dty || null,
          email: null,
          phone: null,
          message: 'Real GST data fetched from GSTN portal',
        });
      } catch (err) {
        console.error('[GST] Verify error:', err);
        return NextResponse.json({
          error: 'Unable to connect to GST service. Please try again.',
          retryable: true,
        }, { status: 503 });
      }
    }

    // Action 3: Direct lookup via the API-key provider (gstinapi.in) — no captcha,
    // no scraper, no GSTN hang. This is the reliable primary path. When no key is
    // configured we return { providerAvailable: false } so the client falls back
    // to the captcha flow above.
    if (action === 'lookupGst') {
      const gst = String(body.gstNumber || '').toUpperCase().trim();
      if (gst.length !== 15) {
        return NextResponse.json({ error: 'Invalid GST number' }, { status: 400 });
      }
      if (!GSTIN_API_KEY) {
        return NextResponse.json({ providerAvailable: false });
      }
      if (!GSTIN_FORMAT.test(gst)) {
        return NextResponse.json({ success: false, error: 'GSTIN format looks invalid. Please check the number.' });
      }

      try {
        let pdata: Record<string, unknown> | null = null;
        let lastStatus = 0;
        // Only 429 and 502 are safe to retry (per provider docs).
        for (let attempt = 0; attempt < 2; attempt++) {
          const res = await fetch(`${GSTIN_API_BASE}/v1/gstin/${gst}`, {
            headers: { 'x-api-key': GSTIN_API_KEY },
            signal: AbortSignal.timeout(15000),
          });
          lastStatus = res.status;
          const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
          if (res.ok && json.success) { pdata = json; break; }
          if (res.status === 429 || res.status === 502) {
            await new Promise(r => setTimeout(r, 1500));
            continue;
          }
          const msg = typeof json.error === 'string' ? json.error
            : res.status === 404 ? 'This GSTIN is not registered in the GST database.'
            : res.status === 402 ? 'GST lookup limit reached — please try again later.'
            : res.status === 401 ? 'GST lookup is not configured correctly.'
            : 'GST lookup failed. Please try again.';
          return NextResponse.json({ success: false, error: msg, notFound: res.status === 404 });
        }

        if (!pdata) {
          return NextResponse.json({ success: false, error: 'GST provider is temporarily unavailable. Please try again in a moment.', retryable: true, providerStatus: lastStatus });
        }

        const d = (pdata.data as Record<string, unknown>) || {};
        const stateCode = gst.slice(0, 2);
        const pan = gst.slice(2, 12);
        const entityType = PAN_ENTITY[pan.charAt(3)] || 'proprietorship';

        if (typeof pdata.credits_remaining === 'number') {
          console.log(`[GST] provider credits_remaining=${pdata.credits_remaining} for ${gst}`);
        }

        return NextResponse.json({
          success: true,
          source: 'gstinapi',
          gstNumber: gst,
          pan,
          stateName: STATE_CODES[stateCode] || 'Unknown',
          entityType,
          companyName: (d.legal_name as string) || null,
          tradeName: (d.trade_name as string) || null,
          address: (d.address as string) || null,
          legalName: (d.legal_name as string) || null,
          registrationDate: (d.registration_date as string) || null,
          constitution: (d.business_constitution as string) || null,
          natureOfBusiness: (d.nature_of_business as string) || null,
          gstStatus: (d.status as string) || null,
          taxpayerType: (d.taxpayer_type as string) || null,
          email: null,
          phone: null,
          message: 'GST data fetched from GSTIN provider',
        });
      } catch (err) {
        console.error('[GST] provider lookup error:', err);
        return NextResponse.json({ success: false, error: 'Unable to reach GST provider. Please try again.', retryable: true });
      }
    }

    return NextResponse.json({ error: 'Invalid action. Use getCaptcha or verifyGST.' }, { status: 400 });
  } catch (error) {
    console.error('[GST] Lookup error:', error);
    return NextResponse.json({ error: 'Failed to process GST request' }, { status: 500 });
  }
}
