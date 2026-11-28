import type { Metadata } from 'next';
import { pageMetadata, absoluteUrl } from '@/lib/seo';
import { HOME_FAQS } from '@/lib/faqs';
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd';
import LandingPage from '@/components/landing/LandingPage';

// Server entry for the home page so it carries its own canonical and social card;
// the interactive landing UI itself is a client component.
export const metadata: Metadata = {
  ...pageMetadata({
    title: 'AINOS Business Suite — GST Billing, CRM, HR & AI',
    description:
      'AINOS Business Suite runs GST invoicing, CRM, HR and payroll, inventory, marketing and AI in one workspace. Built in India, used by teams worldwide.',
    path: '/',
    keywords: [
      'business suite',
      'all-in-one business suite',
      'business software India',
      'GST billing software',
      'CRM software',
      'HR and payroll software',
      'ERP for small business',
    ],
  }),
  // The page title already carries the brand.
  title: { absolute: 'AINOS Business Suite — GST Billing, CRM, HR & AI' },
};

// FAQPage is the signal answer engines read to quote the home page directly.
const FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${absoluteUrl('/')}#faq`,
  mainEntity: HOME_FAQS.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={FAQ_JSON_LD} />
      <JsonLd
        data={breadcrumbJsonLd([{ name: 'Home', url: absoluteUrl('/') }])}
      />
      <LandingPage />
    </>
  );
}
