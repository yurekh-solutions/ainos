import { NextResponse } from 'next/server';
import { wakeGstScraper } from '@/lib/gst-warm';

// Lightweight ping endpoint for keep-alive monitoring
// Returns 200 OK immediately without any database/Redis calls
export async function GET() {
  // The scheduler only ever pings this route, so the GST scraper used to sleep
  // even while the main app stayed warm - and the next GST lookup then paid the
  // whole cold start. The wake is detached and throttled, so this response is
  // still instant and still makes no database or Redis call.
  wakeGstScraper();
  return new NextResponse('OK', {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
