import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Terms and Conditions',
  description: 'The terms that govern your use of AINOS: accounts, plans, credits, payments, refunds, AI features, acceptable use and liability.',
  path: '/terms',
});

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
