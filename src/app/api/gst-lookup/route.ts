import { NextRequest, NextResponse } from 'next/server';

// GST Scraper - Self-hosted Flask server on Render
// Flow: getCaptcha → user solves captcha → verifyGST → real data
const FLASK_URL = process.env.GST_SCRAPER_URL || 'https://ainos-gst-scraper.onrender.com';

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
          gstStatus: data.sts || null,
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

    return NextResponse.json({ error: 'Invalid action. Use getCaptcha or verifyGST.' }, { status: 400 });
  } catch (error) {
    console.error('[GST] Lookup error:', error);
    return NextResponse.json({ error: 'Failed to process GST request' }, { status: 500 });
  }
}
