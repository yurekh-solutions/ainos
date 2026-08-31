'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

// next-auth v4's cross-tab sync channel: the SessionProvider listens for
// `storage` events on this exact localStorage key and refetches the session
// with no guards (the "storage" path is the only one that bypasses the
// visibilitychange/interval checks that bail out when the cached session is
// null after a failed initial fetch).
const NEXTAUTH_STORAGE_KEY = 'nextauth.message';

// Backoff for retries after 'online' fires while the network stack is still
// half-initialized (ERR_NETWORK_IO_SUSPENDED can outlive the event itself).
const RETRY_DELAYS_MS = [0, 2000, 6000] as const;

// Mount-time fallback poll: covers the case where no browser event fires at
// all after a failed session fetch (dev-server restart while the tab is
// already focused and visible — localhost never toggles navigator.onLine,
// and focus/visibilitychange need user interaction).
const POLL_INTERVAL_MS = 10_000;
const POLL_WINDOW_MS = 60_000;

// next-auth logs CLIENT_FETCH_ERROR via console.error on every network-level
// session-fetch failure (dev restarts, sleep, WiFi flaps). This hook now
// recovers from all of those, so filter that one message to keep the console
// clean. Patched once per page — AuthProvider is mounted in two layouts.
let consoleMuted = false;
function muteTransientAuthErrorsOnce() {
  if (consoleMuted || typeof window === 'undefined') return;
  consoleMuted = true;
  const original = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('CLIENT_FETCH_ERROR')) return;
    original(...args);
  };
}

type ProbeVerdict = 'signed-in' | 'signed-out' | 'error';

/**
 * Recovers the NextAuth session after transient network failures
 * (ERR_NETWORK_IO_SUSPENDED, wake-from-sleep, WiFi blips).
 *
 * Why this is needed in next-auth v4: when the initial session fetch fails,
 * `fetchData` swallows the error and returns null, so the provider caches
 * `_session = null` and `useSession().status` becomes "unauthenticated".
 * Its built-in recovery paths then do nothing: `refetchInterval` only fires
 * when a session already exists, and the `visibilitychange` handler returns
 * early while `_session === null`. The only built-in escape is a `storage`
 * broadcast from *another* tab.
 *
 * Neither `getSession({ force: true })` nor `signIn('refresh')` can fix this
 * from app code: the `force` flag is ignored by the v4 client, public
 * `getSession()` never updates the provider's React state in the same tab,
 * and `signIn('refresh')` would redirect to the sign-in page.
 *
 * Instead, this hook probes `/api/auth/session` with a raw fetch (so network
 * errors throw instead of collapsing into null — letting us tell "offline"
 * apart from "signed out"), and when a session is found it dispatches a
 * synthetic `storage` event on next-auth's own channel, which drives the
 * provider's unguarded refetch path and updates every `useSession()`
 * consumer. A short mount-time poll covers the no-event case above.
 */
export function useSessionRecovery() {
  const { status } = useSession();

  // Latest-value ref so event listeners can read the current status without
  // being re-registered on every session state change.
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Guards against overlapping retry loops when 'online' and 'focus' fire
  // in quick succession after a wake-from-sleep.
  const recoveringRef = useRef(false);

  // Read through a function so TypeScript's control-flow narrowing of
  // `statusRef.current` (which would otherwise persist across awaits inside
  // the retry loop) doesn't flag later comparisons as unreachable.
  const isAuthed = useCallback(() => statusRef.current === 'authenticated', []);

  const forceProviderResync = useCallback(() => {
    try {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: NEXTAUTH_STORAGE_KEY,
          newValue: JSON.stringify({
            event: 'session',
            data: { trigger: 'recovery' },
            timestamp: Math.floor(Date.now() / 1000),
          }),
        }),
      );
    } catch {
      // StorageEvent constructor unavailable — manual refresh still works.
    }
  }, []);

  // Resolves true when callers should stop retrying: either the session was
  // recovered, or the endpoint is reachable and reports no session (a genuine
  // sign-out — nothing to recover).
  const recover = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) return false;
    if (recoveringRef.current) return false;
    recoveringRef.current = true;
    try {
      for (const delay of RETRY_DELAYS_MS) {
        if (delay > 0) await new Promise((r) => setTimeout(r, delay));
        if (isAuthed()) return true;

        let verdict: ProbeVerdict;
        try {
          const res = await fetch('/api/auth/session', {
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
          });
          if (!res.ok) {
            verdict = 'error';
          } else {
            const data = await res.json();
            // next-auth returns {} for an unauthenticated visitor.
            verdict = data && Object.keys(data).length > 0 ? 'signed-in' : 'signed-out';
          }
        } catch {
          // Raw fetch throws where next-auth's fetchData would swallow the
          // error — this is the "network still suspended" case, so retry.
          verdict = 'error';
        }

        if (verdict === 'signed-out') return true; // endpoint reachable, nothing to recover
        if (verdict === 'signed-in') {
          forceProviderResync();
          // Give the provider's async refetch a moment to land, then re-check.
          await new Promise((r) => setTimeout(r, 1500));
          if (isAuthed()) return true;
        }
      }
      return isAuthed();
    } finally {
      recoveringRef.current = false;
    }
  }, [forceProviderResync, isAuthed]);

  useEffect(() => {
    muteTransientAuthErrorsOnce();

    const maybeRecover = () => {
      // Wake-from-sleep often restores the tab already visible, so neither
      // next-auth's visibilitychange refetch nor an `online` event may fire —
      // recheck on focus/visible too. Already-authenticated users skip.
      if (isAuthed()) return;
      void recover();
    };
    window.addEventListener('online', maybeRecover);
    window.addEventListener('focus', maybeRecover);
    document.addEventListener('visibilitychange', maybeRecover);
    return () => {
      window.removeEventListener('online', maybeRecover);
      window.removeEventListener('focus', maybeRecover);
      document.removeEventListener('visibilitychange', maybeRecover);
    };
  }, [recover, isAuthed]);

  // Fallback: poll briefly after mount in case the initial session fetch
  // failed and no browser event ever fires (dev restart while the tab is
  // focused/visible). Gives up after POLL_WINDOW_MS; the event listeners
  // above remain the permanent safety net.
  useEffect(() => {
    if (isAuthed()) return;
    const startedAt = Date.now();
    const timer = setInterval(() => {
      if (isAuthed()) {
        clearInterval(timer);
        return;
      }
      // Hidden tabs are covered by the visibilitychange listener above.
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - startedAt > POLL_WINDOW_MS) {
        clearInterval(timer);
        return;
      }
      void recover().then((stop) => {
        if (stop) clearInterval(timer);
      });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [recover, isAuthed]);
}
