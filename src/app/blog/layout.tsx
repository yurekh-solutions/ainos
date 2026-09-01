import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AINOS Blog — AI SEO Insights & Growth Strategies',
  description:
    'Expert guides on AI-powered SEO, content automation, and organic growth — written for businesses serious about search visibility.',
  openGraph: {
    title: 'AINOS Blog — AI SEO Insights & Growth Strategies',
    description:
      'Expert guides on AI-powered SEO, content automation, and organic growth.',
    siteName: 'AINOS Blog',
    type: 'website',
  },
};

export const dynamic = 'force-dynamic';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
