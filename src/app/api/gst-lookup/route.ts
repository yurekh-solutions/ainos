import { NextRequest, NextResponse } from 'next/server';

// GST Scraper - Self-hosted Flask server (100% free, unlimited)
// Flow: getCaptcha → user solves captcha → verifyGST → real data
const FLASK_URL = process.env.GST_SCRAPER_URL || 'http://localhost:5001';

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
        const res = await fetch(`${FLASK_URL}/api/v1/getCaptcha`, {
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) {
          return NextResponse.json({ error: 'Failed to fetch captcha from GSTN portal' }, { status: 502 });
        }
        const data = await res.json();
        return NextResponse.json({
          success: true,
          sessionId: data.sessionId,
          captchaImage: data.image,
          gstNumber: gstNumber.toUpperCase().trim(),
        });
      } catch (err) {
        console.error('Flask captcha error:', err);
        return NextResponse.json({ error: 'GST scraper server not running. Start Flask server on port 5001.' }, { status: 503 });
      }
    }

    // Action 2: Verify GST with captcha solution
    if (action === 'verifyGST') {
      const { sessionId, gstNumber, captchaText } = body;
      if (!sessionId || !gstNumber || !captchaText) {
        return NextResponse.json({ error: 'Missing sessionId, gstNumber, or captchaText' }, { status: 400 });
      }

      try {
        const res = await fetch(`${FLASK_URL}/api/v1/getGSTDetails`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            GSTIN: gstNumber.toUpperCase().trim(),
            captcha: captchaText.trim(),
          }),
          signal: AbortSignal.timeout(15000),
        });

        if (!res.ok) {
          return NextResponse.json({ error: 'Failed to verify GST with GSTN portal' }, { status: 502 });
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
        // Use real entity type from GSTN if available, otherwise fall back to PAN parse
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
          // Real data from GSTN
          companyName: data.lgnm || null,
          tradeName: data.tradeNam || null,
          address: addr || null,
          legalName: data.lgnm || null,
          registrationDate: data.rgdt || null,
          constitution: data.ctb || data.ctj || null,
          natureOfBusiness: Array.isArray(data.nba) ? data.nba.join(', ') : (data.nba || null),
          gstStatus: data.sts || null,
          taxpayerType: data.dty || null,
          email: null, // GSTN portal doesn't provide email
          phone: null, // GSTN portal doesn't provide phone
          message: 'Real GST data fetched from GSTN portal',
        });
      } catch (err) {
        console.error('Flask verify error:', err);
        return NextResponse.json({ error: 'Failed to connect to GST scraper' }, { status: 503 });
      }
    }

    return NextResponse.json({ error: 'Invalid action. Use getCaptcha or verifyGST.' }, { status: 400 });
  } catch (error) {
    console.error('GST lookup error:', error);
    return NextResponse.json({ error: 'Failed to process GST request' }, { status: 500 });
  }
}
