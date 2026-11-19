import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  ...pageMetadata({
    title: 'Create Your Business Account',
    description: 'Register your business on AINOS and run GST invoicing, CRM, HR & payroll, inventory, marketing and AI from one platform.',
    path: '/auth/register',
    keywords: ['business software signup', 'GST billing software account'],
  }),
  robots: { index: true, follow: true },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
