import { NextRequest, NextResponse } from 'next/server';

// Server-side keep-alive for the GST scraper Render service.
// Called by the dashboard's KeepScraperAlive component every 4 minutes.
// Because this runs on AINOS's own server (not the client's browser),
// it reliably wakes the scraper even when GitHub Actions cron is delayed.
const FLASK_URL = process.env.GST_SCRAPER_URL || 'https://ainos-gst-scraper.onrender.com';

let lastPing = 0;
const PING_INTERVAL = 4 * 60 * 1000; // 4 minutes — under Render's 15-min sleep window

export async function GET() {
  const now = Date.now();
  if (now - lastPing < PING_INTERVAL) {
    return NextResponse.json({ status: 'ok', cached: true });
  }
  lastPing = now;

  try {
    const res = await fetch(`${FLASK_URL}/api/v1/getCaptcha`, {
      signal: AbortSignal.timeout(15000),
    });
    return NextResponse.json({
      status: res.ok ? 'alive' : 'waking',
      httpStatus: res.status,
    });
  } catch {
    return NextResponse.json({ status: 'cold', message: 'Scraper starting up' });
  }
}
