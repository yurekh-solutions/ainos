import SiteHeader from '@/components/marketing/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export default function MarketingSiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <SiteHeader />
      <main id="main-content" className="pt-16">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
