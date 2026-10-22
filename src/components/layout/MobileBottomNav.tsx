'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MoreHorizontal } from 'lucide-react';
import { NAV_GROUPS, isDashboardActive, isGroupActive } from './navigation';
import { OPEN_SIDEBAR_EVENT } from './TopBar';

const itemClass = (active: boolean) =>
  `flex-1 flex flex-col items-center justify-center gap-1 h-full text-[11px] font-medium transition-colors ${
    active ? 'text-[#5b21b6]' : 'text-neutral-500 hover:text-neutral-800'
  }`;

// Bottom nav shows only the most-used groups; everything else lives in the sidebar via "More"
const BOTTOM_GROUP_KEYS = ['finance', 'ecommerce', 'pos'] as const;

export function MobileBottomNav() {
  const pathname = usePathname() || '';
  const bottomGroups = NAV_GROUPS.filter(g => (BOTTOM_GROUP_KEYS as readonly string[]).includes(g.key));

  return (
    <nav
      aria-label="Primary"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-neutral-100 shadow-[0_-4px_16px_-8px_rgba(16,24,40,0.12)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-stretch h-16 max-w-md mx-auto">
        <Link href="/dashboard" className={itemClass(isDashboardActive(pathname))}>
          <Home className="w-5 h-5" />
          Home
        </Link>
        {bottomGroups.map(group => {
          const Icon = group.icon;
          return (
            <Link key={group.key} href={group.href} className={itemClass(isGroupActive(pathname, group))}>
              <Icon className="w-5 h-5" />
              {group.shortTitle || group.title}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(OPEN_SIDEBAR_EVENT))}
          className={itemClass(false)}
        >
          <MoreHorizontal className="w-5 h-5" />
          More
        </button>
      </div>
    </nav>
  );
}
