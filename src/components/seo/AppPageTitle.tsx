'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { titleForAppPath } from '@/lib/seo-catalog';

// App screens that are not a single catalog tool.
const APP_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/tools': 'Tools & AI',
  '/billing': 'Billing & Credits',
  '/settings': 'Settings',
  '/company': 'Company',
  '/admin': 'Admin',
  '/websites': 'Websites',
  '/services': 'Services',
  '/finance': 'Finance',
  '/ai': 'AI Studio',
};

function resolveTitle(pathname: string): string | null {
  const exact = APP_TITLES[pathname];
  if (exact) return exact;
  const fromCatalog = titleForAppPath(pathname);
  if (fromCatalog) return fromCatalog;
  const prefix = Object.keys(APP_TITLES)
    .filter((p) => pathname.startsWith(`${p}/`))
    .sort((a, b) => b.length - a.length)[0];
  return prefix ? APP_TITLES[prefix] : null;
}

/** Sets the browser tab title for signed-in app screens (they are client pages without metadata). */
export function AppPageTitle() {
  const pathname = usePathname();

  useEffect(() => {
    // Pages like /approvals/new export their own metadata title.
    if (!pathname || pathname.endsWith('/new')) return;
    const title = resolveTitle(pathname);
    if (title) document.title = `${title} | AINOS`;
  }, [pathname]);

  return null;
}
