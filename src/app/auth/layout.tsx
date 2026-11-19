import type { Metadata } from 'next';

// Password-reset, error and other account screens are transactional and must
// never appear in search; sign-in and register opt back in with their own layouts.
export const metadata: Metadata = {
  title: { default: 'Account', template: '%s | AINOS' },
  robots: { index: false, follow: true },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
