import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  ...pageMetadata({
    title: 'Sign In',
    description: 'Sign in to AINOS to open your invoices, CRM, HR, inventory, marketing and AI tools.',
    path: '/auth/signin',
  }),
  robots: { index: true, follow: true },
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
