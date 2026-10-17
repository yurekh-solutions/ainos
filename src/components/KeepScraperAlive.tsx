'use client';
import { useEffect, useRef } from 'react';

// Pings /api/keep-scraper-alive every 4 minutes while the user is on the dashboard.
// The server-side endpoint then pings the GST scraper Render service, keeping it
// awake. This creates a self-sustaining loop: as long as anyone uses AINOS,
// the scraper stays warm — no reliance on GitHub Actions cron timing.
export function KeepScraperAlive() {
  const firedRef = useRef(false);

  useEffect(() => {
    const ping = () => {
      fetch('/api/keep-scraper-alive', { cache: 'no-store' }).catch(() => {});
    };

    // Fire immediately on mount (covers the case where scraper just slept)
    if (!firedRef.current) {
      ping();
      firedRef.current = true;
    }

    // Then every 4 minutes — safely under Render's 15-min sleep window
    const id = setInterval(ping, 4 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return null;
}
