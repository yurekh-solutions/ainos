import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { ToolsDirectory } from '@/components/seo/ToolsDirectory';
import SocialLinks from '@/components/SocialLinks';
import { FOOTER_GROUPS } from '@/lib/site-content';

// One footer for the whole public site. On the landing page the section links
// scroll in place; on every other page they point back at the home page sections.
type NavHandler = (event: React.MouseEvent<HTMLAnchorElement>, hash: string) => void;

const SECTION_LINKS = [
  { label: 'Modules', href: '#modules' },
  { label: 'How it works', href: '#how' },
  { label: 'Coverage', href: '#coverage' },
];

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
        className="transition-colors hover:text-[#4c1d95]"
      >
        {label}
      </a>
    ) : (
      <Link href={`/${href}`} className="transition-colors hover:text-[#4c1d95]">
        {label}
      </Link>
    );

  const footerLink = (label: string, href: string) => {
    if (href.startsWith('http')) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-[#4c1d95]"
        >
          {label}
        </a>
      );
    }
    return (
      <Link href={href} className="transition-colors hover:text-[#4c1d95]">
        {label}
      </Link>
    );
  };

  return (
    <footer className="bg-white">
      <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <ToolsDirectory className="border-b border-gray-200 pb-10" />
      </div>

      <div className="border-t border-purple-100 bg-[#fbf9ff] text-gray-600">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-12">
            <div className="col-span-2 md:col-span-4">
              <Link href="/" className="inline-flex items-center" aria-label="AINOS home">
                <Image
                  src="/ainos-wordmark.png"
                  alt="AINOS"
                  width={100}
                  height={34}
                  className="h-7 w-auto object-contain"
                />
              </Link>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-600">
                The business operating suite for finance, CRM, people, inventory, marketing and AI. Built by Yurekh
                Solutions in Mumbai.
              </p>
              <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
                {SECTION_LINKS.map(({ label, href }) => (
                  <span key={href}>{sectionLink(label, href)}</span>
                ))}
              </div>
            </div>

            {FOOTER_GROUPS.map((group) => (
              <div key={group.title} className="md:col-span-2">
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4c1d95]">
                  {group.title}
                </p>
                <ul className="space-y-3 text-sm">
                  {group.links.map((link) => (
                    <li key={`${group.title}-${link.href}`}>{footerLink(link.label, link.href)}</li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="col-span-2 md:col-span-2">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4c1d95]">Get started</p>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 rounded-full bg-[#5b21b6] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#4c1d95]"
              >
                Create account <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/auth/signin" className="mt-3 block text-sm text-gray-600 transition-colors hover:text-[#4c1d95]">
                Sign in
              </Link>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 border-t border-purple-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-relaxed text-gray-500">
              © {new Date().getFullYear()} AINOS. All rights reserved.{' '}
              <Link
                href="https://yurekh.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#4c1d95] transition-colors hover:text-[#5b21b6]"
              >
                YUREKH
              </Link>
            </p>
            <SocialLinks tone="light" className="justify-start sm:justify-end" />
          </div>
        </div>
      </div>
    </footer>
  );
}
