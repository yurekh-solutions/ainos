import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Blog — AI SEO Insights & Growth Strategies',
  description:
    'Expert guides on AI-powered SEO, content automation, and organic growth — written for businesses serious about search visibility.',
  path: '/blog',
});

export const dynamic = 'force-dynamic';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
