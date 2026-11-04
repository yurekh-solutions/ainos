import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GST Scraper - Self-hosted Flask server on Render
// Flow: getCaptcha → user solves captcha → verifyGST → real data
const FLASK_URL = process.env.GST_SCRAPER_URL || 'https://ainos-gst-scraper.onrender.com';

// How long a cached GST lookup stays usable before we prefer a fresh portal
// hit. GST registration status can change (Active -> Cancelled), so this is a
// bounded TTL, not indefinite. Override with GST_CACHE_TTL_DAYS.
const CACHE_TTL_DAYS = Number(process.env.GST_CACHE_TTL_DAYS || 30);
const normGst = (v: unknown): string => typeof v === 'string' ? v.toUpperCase().trim() : '';

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

    // Action 0: Return a cached GST lookup if one exists and is fresh, so the
    // client can auto-fill WITHOUT hitting GSTN at all. This is the resilience
    // path for GSTN "Scheduled Downtime". A miss/stale simply returns
    // cached:false and the caller falls back to the live captcha flow.
    if (action === 'getCached') {
      const gst = normGst(body.gstNumber);
      if (!gst || gst.length !== 15) {
        return NextResponse.json({ error: 'Invalid GST number' }, { status: 400 });
      }
      try {
        const row = await prisma.gstLookupCache.findUnique({ where: { gstNumber: gst } });
        if (!row) return NextResponse.json({ success: false, cached: false });
        const ageMs = Date.now() - row.fetchedAt.getTime();
        const fresh = ageMs <= CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;
        if (!fresh) return NextResponse.json({ success: false, cached: false, stale: true });
        return NextResponse.json({ success: true, cached: true, source: 'cache', fetchedAt: row.fetchedAt, ...(row.payload as Record<string, unknown>) });
      } catch (err) {
        // Cache is a best-effort optimization; never let it break the flow.
        console.error('[GST] Cache read error:', err);
        return NextResponse.json({ success: false, cached: false });
      }
    }

    // Action 1: Get captcha for GST verification
    if (action === 'getCaptcha') {
      const { gstNumber } = body;
      if (!gstNumber || gstNumber.length !== 15) {
        return NextResponse.json({ error: 'Invalid GST number' }, { status: 400 });
      }

      try {
        // Keep EACH outbound call well under Render's ~55s edge-gateway window
        // (single bounded attempt, 18s ceiling). Retrying lives on the client, so
        // the gateway never kills this request mid-flight and returns a raw 502.
        const res = await fetchWithRetry(
          `${FLASK_URL}/api/v1/getCaptcha`,
          { signal: AbortSignal.timeout(18000) },
          1, // single attempt server-side; the client handles retries
          1200
        );
        if (!res.ok) {
          console.warn(`[GST] Captcha upstream returned ${res.status}`);
          // 200 + success:false so the browser shows a friendly "busy" message
          // instead of a scary red 502 in the console. Feature is not disabled.
          // Prefer the scraper's specific reason (e.g. GSTN scheduled downtime)
          // when it provides one. Otherwise this is almost always our own
          // free-tier scraper cold-starting (the request never reached GSTN), so
          // we say that honestly instead of falsely claiming a rate limit.
          const upstream = await res.json().catch(() => ({}) as { error?: string });
          return NextResponse.json({
            success: false,
            error: upstream?.error
              || 'The GST service is warming up. Please try again in a few seconds.',
            retryable: true,
          });
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
          success: false,
          error: 'Unable to reach the GST portal right now. Please try again.',
          retryable: true,
        });
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
            signal: AbortSignal.timeout(18000),
          },
          1, // single bounded attempt to stay well under the edge gateway
          1200
        );

        if (!res.ok) {
          return NextResponse.json({
            success: false,
            error: 'GST verification failed. The GSTN portal may be busy. Please try again.',
            retryable: true,
          });
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

        const result = {
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
        };

        // Persist the successful live lookup so future requests for this GSTIN
        // can auto-fill from cache even while GSTN is in scheduled downtime.
        // Best-effort: a cache-write failure must never break the live result.
        try {
          const { success: _s, message: _m, ...payload } = result;
          await prisma.gstLookupCache.upsert({
            where: { gstNumber: gst },
            create: { gstNumber: gst, payload, gstStatus: result.gstStatus, source: 'gstn-portal' },
            update: { payload, gstStatus: result.gstStatus, source: 'gstn-portal' },
          });
        } catch (err) {
          console.error('[GST] Cache write failed:', err);
        }

        return NextResponse.json(result);
      } catch (err) {
        console.error('[GST] Verify error:', err);
        return NextResponse.json({
          error: 'Unable to connect to GST service. Please try again.',
          retryable: true,
        }, { status: 503 });
      }
    }

    // Legacy no-op shim: browser bundles cached from before the third-party
    // provider removal still POST action:'lookupGst' first. Rather than returning
    // a scary 400 (which surfaced as "Invalid action"), acknowledge it so those
    // stale clients fall through to the working captcha flow. No provider/API is
    // called here — this is purely backward-compatibility during cache transition.
    if (action === 'lookupGst') {
      return NextResponse.json({ success: false, providerAvailable: false });
    }

    return NextResponse.json({ error: 'Invalid action. Use getCaptcha or verifyGST.' }, { status: 400 });
  } catch (error) {
    console.error('[GST] Lookup error:', error);
    return NextResponse.json({ error: 'Failed to process GST request' }, { status: 500 });
  }
}
