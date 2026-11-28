import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Blog — GST, CRM and AI Guides',
  description:
    'Practical guides from the AINOS team on GST billing, CRM, SEO and AI automation for small and growing businesses in India.',
  path: '/blog',
});

export const dynamic = 'force-dynamic';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
