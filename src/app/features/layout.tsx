import SiteHeader from '@/components/marketing/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

// Public marketing chrome for every /features page: server-rendered so crawlers
// see real links to every suite and tool, no sign-in required.
export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
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
