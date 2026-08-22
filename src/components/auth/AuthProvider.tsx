'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider
      refetchOnWindowFocus={true}
      refetchInterval={4 * 60}
    >
      {children}
    </SessionProvider>
  );
}
