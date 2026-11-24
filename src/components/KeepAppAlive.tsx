'use client';
import { useEffect, useRef } from 'react';

// Keeps the whole product awake, not just the scraper. Render's free instances
// sleep after ~15 idle minutes, and the request that discovers the sleep is the
// one that pays for it - visitors used to land on Render's "application loading"
// screen while the app booted. /api/ping answers in ~300ms with no database or
// Redis call and wakes the GST scraper and template extractor on the way back,
// so every open tab quietly keeps all three services warm.
//
// This is the source that does not depend on GitHub's scheduler: as long as
// someone has the site open, nobody behind them gets a cold start.
const PING_INTERVAL_MS = 60_000;

export function KeepAppAlive() {
  const startedRef = useRef(false);

  useEffect(() => {
    const ping = () => {
      fetch('/api/ping', { cache: 'no-store' }).catch(() => {});
    };

    // Fire on mount so the very first visitor after a sleep starts the boot
    // immediately instead of waiting for the timer.
    if (!startedRef.current) {
      ping();
      startedRef.current = true;
    }

    // Browsers clamp timers in background tabs (and Chrome can freeze a hidden
    // tab altogether), so a hidden tab may drift past this interval. The
    // visibility handler below closes that gap the moment the tab is shown.
    const id = setInterval(ping, PING_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState === 'visible') ping();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return null;
}
