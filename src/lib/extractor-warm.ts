// Wakes the invoice-template extractor (Flask on Render free tier) the same way
// gst-warm.ts wakes the GST scraper. The extractor sleeps after ~15 idle minutes
// and pays a full boot on the next request, so the first template extraction
// after a quiet period used to look like a hang.
//
// Like the scraper helper, this only makes an existing service come up sooner -
// it never gates, replaces or disables the feature that calls it.
const EXTRACTOR_URL = process.env.TEMPLATE_EXTRACTOR_URL;

// Cold starts on a free Render instance have been measured around 30s, so allow
// comfortably more than that before giving up on the wake.
const WAKE_TIMEOUT_MS = 45_000;
// Render sleeps after ~15 idle minutes; waking more often than this buys nothing.
const WAKE_INTERVAL_MS = 3 * 60 * 1000;

let lastWakeAt = 0;

/**
 * Fire-and-forget health ping that pulls the template extractor out of its sleep.
 * Never awaited, never thrown, and throttled per server instance. Does nothing
 * when TEMPLATE_EXTRACTOR_URL is unset (local development without the service).
 */
export function wakeTemplateExtractor(force = false): void {
  if (!EXTRACTOR_URL) return;
  const now = Date.now();
  if (!force && now - lastWakeAt < WAKE_INTERVAL_MS) return;
  lastWakeAt = now;

  fetch(`${EXTRACTOR_URL.replace(/\/$/, '')}/api/v1/health`, {
    method: 'GET',
    signal: AbortSignal.timeout(WAKE_TIMEOUT_MS),
    headers: { 'user-agent': 'AINOS-Warmup/1.0' },
  })
    .then((res) => {
      // Drain the body so the socket closes cleanly and the request is not left
      // half-read on the extractor side.
      res.body?.cancel().catch(() => {});
    })
    .catch(() => {
      // Offline, timed out or DNS trouble - the caller's own request still
      // reports the real outcome, so nothing is logged as an error here.
    });
}
