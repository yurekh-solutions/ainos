import type { Metadata } from 'next';
import { KeepScraperAlive } from '@/components/KeepScraperAlive';

// Password-reset, error and other account screens are transactional and must
// never appear in search; sign-in and register opt back in with their own layouts.
export const metadata: Metadata = {
  title: { default: 'Account', template: '%s | AINOS' },
  robots: { index: false, follow: true },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* The GST auto-fill on the signup form is the first thing a new business
          ever types, and until now nothing kept the scraper awake on this public
          side of the app - only the dashboard did. Mounting the same warm-up
          here means the service is already booting while the form is read. */}
      <KeepScraperAlive />
      {children}
    </>
  );
}
