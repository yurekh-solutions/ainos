'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider
      basePath="/ainos/api/auth"
      refetchOnWindowFocus={true}
      refetchInterval={4 * 60} // Refetch session every 4 minutes to keep alive
    >
      {children}
    </SessionProvider>
  );
}
