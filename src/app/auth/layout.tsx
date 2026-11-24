import type { Metadata } from 'next';

// Password-reset, error and other account screens are transactional and must
// never appear in search; sign-in and register opt back in with their own layouts.
export const metadata: Metadata = {
  title: { default: 'Account', template: '%s | AINOS' },
  robots: { index: false, follow: true },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // The GST auto-fill on the signup form is the first thing a new business ever
  // types. The warm-up that keeps the scraper ready for it used to be mounted
  // here; it now lives once in the root layout (src/components/KeepAppAlive),
  // which covers these screens along with every public and dashboard page.
  return children;
}
