import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import LandingPage from '@/components/landing/LandingPage';

// Server entry for the home page so it carries its own canonical and social card;
// the interactive landing UI itself is a client component.
export const metadata: Metadata = {
  ...pageMetadata({
    title: 'AINOS — GST Billing, CRM, HR & AI Business Suite',
    description:
      'Run GST invoicing, CRM, HR & payroll, inventory, marketing and AI tools from one platform built for Indian businesses. Tally import and export included.',
    path: '/',
    keywords: ['business software India', 'GST billing software', 'CRM software', 'HR and payroll software', 'ERP for small business'],
  }),
  // The page title already carries the brand.
  title: { absolute: 'AINOS — GST Billing, CRM, HR & AI Business Suite' },
};

export default function HomePage() {
  return <LandingPage />;
}
