'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Keeps the session alive by pinging the session endpoint every 5 minutes.
 * Prevents session expiry while user is actively using the dashboard.
 */
export function SessionKeepAlive() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.email) return;

    // Ping session endpoint every 5 minutes to keep alive
    const interval = setInterval(() => {
      fetch('/api/auth/session').catch(() => {
        // Silently fail - session will just expire naturally if server is down
      });
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [session?.user?.email]);

  return null; // This component renders nothing
}
