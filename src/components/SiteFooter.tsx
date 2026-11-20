import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { ToolsDirectory } from '@/components/seo/ToolsDirectory';
import SocialLinks from '@/components/SocialLinks';

// One footer for the whole public site. On the landing page the section links
// scroll in place; on every other page they point back at the home page sections.
type NavHandler = (event: React.MouseEvent<HTMLAnchorElement>, hash: string) => void;

const SECTION_LINKS = [
  { label: 'Modules', href: '#modules' },
  { label: 'How it works', href: '#how' },
  { label: 'Why AINOS', href: '#workflow' },
];

const COMPANY_SECTION_LINKS = [{ label: 'About', href: '#about' }];

export default function SiteFooter({
  onHome = false,
  onNavigate,
}: {
  onHome?: boolean;
  onNavigate?: NavHandler;
}) {
  const sectionLink = (label: string, href: string) =>
    onHome ? (
      <a
        href={href}
        onClick={(event) => onNavigate?.(event, href)}
        className="hover:text-[#4c1d95] transition-colors"
      >
        {label}
      </a>
    ) : (
      <Link href={`/${href}`} className="hover:text-[#4c1d95] transition-colors">
        {label}
      </Link>
    );

  return (
    <footer className="border-t border-gray-100 bg-gray-50/40">
      <div className="max-w-7xl mx-auto py-14 px-4 sm:px-6 lg:px-8">
        {/* Suite and tool directory sits above the columns so every tool page is one click away. */}
        <ToolsDirectory className="mb-12 border-b border-gray-200 pb-12" />

        <div className="grid grid-cols-2 md:grid-cols-12 gap-8 md:gap-6 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-5">
            <Image src="/ainos-wordmark.png" alt="AINOS" width={100} height={34} className="h-7 w-auto object-contain" />
            <p className="text-sm text-gray-500 leading-relaxed mt-3 max-w-xs">
              The business operating suite — finance, CRM, HR, inventory and AI in one platform.
            </p>
          </div>

          {/* Product */}
          <div className="md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Product</p>
            <ul className="space-y-2.5 text-sm text-gray-600">
              {SECTION_LINKS.map(({ label, href }) => (
                <li key={href}>{sectionLink(label, href)}</li>
              ))}
              <li>
                <Link href="/features" className="hover:text-[#4c1d95] transition-colors">All features</Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-[#4c1d95] transition-colors">Blog</Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Company</p>
            <ul className="space-y-2.5 text-sm text-gray-600">
              {COMPANY_SECTION_LINKS.map(({ label, href }) => (
                <li key={href}>{sectionLink(label, href)}</li>
              ))}
              <li>
                <Link href="https://yurekh.com/" target="_blank" rel="noopener noreferrer" className="hover:text-[#4c1d95] transition-colors">Yurekh</Link>
              </li>
              <li>
                <Link href="/auth/signin" className="hover:text-[#4c1d95] transition-colors">Sign In</Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#4c1d95] transition-colors">Privacy</Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#4c1d95] transition-colors">Terms</Link>
              </li>
            </ul>
          </div>

          {/* Get started */}
          <div className="col-span-2 md:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Get started</p>
            <Link href="/auth/register" className="inline-flex items-center gap-2 rounded-full bg-[#4c1d95] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-900/20 transition-colors hover:bg-[#3b0f78]">
              Create account <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <div className="pt-6 border-t border-gray-200 flex items-center justify-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} AINOS. All rights reserved. <Link href="https://yurekh.com/" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#4c1d95] hover:text-[#3b0f78] transition-colors">YUREKH</Link></p>
        </div>
        <SocialLinks className="mt-4" />
      </div>
    </footer>
  );
}
