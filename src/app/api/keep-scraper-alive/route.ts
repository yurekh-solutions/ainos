import { NextResponse } from 'next/server';
import { wakeGstScraper } from '@/lib/gst-warm';

// Server-side keep-alive for the GST scraper Render service.
// Called by the KeepScraperAlive component (dashboard and account screens) about
// every 4 minutes. Because this runs on AINOS's own server (not the client's
// browser), it reliably wakes the scraper even when GitHub Actions cron is
// delayed. The wake now lives in one shared helper used by /api/ping and
// /api/gst-lookup too, so the three paths cannot drift apart - and this answer
// returns straight away instead of waiting out a 15s cold start.
export async function GET() {
  wakeGstScraper();
  return NextResponse.json(
    { status: 'ok' },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
  );
}
