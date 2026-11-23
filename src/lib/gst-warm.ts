// Wakes the self-hosted GST scraper (Flask on Render free tier) without making
// anyone wait for it. The scraper sleeps after ~15 idle minutes and takes ~28s
// to boot, while the lookup route only waits 18s per attempt - so the first
// visitor after a sleep always saw "The GST service is warming up".
//
// This helper starts that boot in the background and returns immediately, so it
// can be called from the DB-free ping route and from the top of the lookup
// route without changing any response timing. Nothing here disables or gates the
// GST feature: it only makes the existing portal path come up sooner.
const FLASK_URL = process.env.GST_SCRAPER_URL || 'https://ainos-gst-scraper.onrender.com';

// Cold start measured at ~28s, so allow well over that before giving up.
const WAKE_TIMEOUT_MS = 45_000;
// Render sleeps after ~15 idle minutes; waking more often than this buys nothing.
const WAKE_INTERVAL_MS = 3 * 60 * 1000;

let lastWakeAt = 0;

/**
 * Fire-and-forget health ping that pulls the scraper out of its sleep.
 * Never awaited, never thrown, and throttled per server instance.
 */
export function wakeGstScraper(force = false): void {
  const now = Date.now();
  if (!force && now - lastWakeAt < WAKE_INTERVAL_MS) return;
  lastWakeAt = now;

  fetch(`${FLASK_URL}/api/v1/health`, {
    method: 'GET',
    signal: AbortSignal.timeout(WAKE_TIMEOUT_MS),
    headers: { 'user-agent': 'AINOS-Warmup/1.0' },
  })
    .then((res) => {
      // Drain the body so the socket closes cleanly and the request is not left
      // half-read on the scraper side.
      res.body?.cancel().catch(() => {});
    })
    .catch(() => {
      // Offline, timed out or DNS trouble - the caller's own request still
      // reports the real outcome, so nothing is logged as an error here.
    });
}
