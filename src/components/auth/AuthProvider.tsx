'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { useSessionRecovery } from '@/hooks/useSessionRecovery';

interface AuthProviderProps {
  children: ReactNode;
}

// Mounted inside SessionProvider so useSessionRecovery() can read the
// session context and force a resync after transient network failures.
function SessionRecovery() {
  useSessionRecovery();
  return null;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider
      refetchOnWindowFocus={true}
      refetchInterval={4 * 60}
    >
      <SessionRecovery />
      {children}
    </SessionProvider>
  );
}
