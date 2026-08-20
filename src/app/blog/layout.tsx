import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AINOS Blog - AI SEO Insights & Growth Strategies',
  description: 'Expert guides on AI-powered business growth, SEO, content automation, and organic traffic strategies.',
};

export const dynamic = 'force-dynamic';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
