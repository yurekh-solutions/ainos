import Link from 'next/link';
import { SEO_SUITES } from '@/lib/seo-catalog';

/**
 * Footer directory linking every suite and every tool landing page. Shared by the
 * landing page and the /features pages so crawlers and visitors reach each tool
 * from anywhere on the public site.
 */
export function ToolsDirectory({ className = '' }: { className?: string }) {
  return (
    <nav aria-label="All AINOS tools" className={className}>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">All suites &amp; tools</p>
        <Link href="/features" className="text-sm font-medium text-[#4c1d95] hover:text-[#3b0f78] transition-colors">
          View all features
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7">
        {SEO_SUITES.map((suite) => (
          <div key={suite.slug} className="min-w-0">
            <Link
              href={`/features/${suite.slug}`}
              className="text-sm font-semibold text-gray-900 hover:text-[#4c1d95] transition-colors"
            >
              {suite.name.replace(/^AINOS /, '')}
            </Link>
            <ul className="mt-2.5 space-y-1.5">
              {suite.tools.map((tool) => (
                <li key={tool.slug}>
                  <Link
                    href={`/features/${suite.slug}/${tool.slug}`}
                    className="text-[13px] leading-snug text-gray-500 hover:text-[#4c1d95] transition-colors"
                  >
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
