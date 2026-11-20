import Link from 'next/link';
import Image from 'next/image';
import SiteFooter from '@/components/SiteFooter';

// Public marketing chrome for every /features page: server-rendered so crawlers
// see real links to every suite and tool, no sign-in required.
export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center" aria-label="AINOS home">
            <Image src="/ainos-wordmark.png" alt="AINOS" width={100} height={34} className="h-7 w-auto object-contain" priority />
          </Link>
          <nav className="flex items-center gap-4 sm:gap-6 text-sm">
            <Link href="/features" className="hidden sm:inline text-gray-700 hover:text-gray-900">Features</Link>
            <Link href="/blog" className="hidden sm:inline text-gray-700 hover:text-gray-900">Blog</Link>
            <Link href="/auth/signin" className="font-medium text-gray-700 hover:text-gray-900">Sign In</Link>
            <Link href="/auth/register" className="rounded-full bg-[#5b21b6] px-4 py-2 font-semibold text-white transition-colors hover:bg-[#4c1d95]">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <SiteFooter />
    </div>
  );
}
