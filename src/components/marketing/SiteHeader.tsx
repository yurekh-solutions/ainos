'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, ChevronDown, Menu, X } from 'lucide-react';
import { SITE_NAV, type NavColumn, type NavEntry } from '@/lib/site-content';

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function menuIsActive(pathname: string, entry: NavEntry) {
  if (entry.kind === 'link') return isActive(pathname, entry.href);
  return entry.columns.some((column) =>
    column.links.some((link) => link.href.startsWith('/') && isActive(pathname, link.href)),
  );
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function NavAnchor({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  if (href.startsWith('http')) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  // Tracking the pathname the drawer / menu was opened on closes it once a link
  // navigates away, without a setState effect on every route change.
  const [drawerFor, setDrawerFor] = useState<string | null>(null);
  const open = drawerFor === pathname;

  const [menuState, setMenuState] = useState<{ key: string; path: string } | null>(null);
  const activeMenuKey = menuState?.path === pathname ? menuState.key : null;
  const activeMenu = SITE_NAV.find(
    (entry): entry is Extract<NavEntry, { kind: 'menu' }> => entry.kind === 'menu' && entry.label === activeMenuKey,
  );

  // The drawer is portalled to <body>: the header carries backdrop-blur, which
  // makes it a containing block, so a fixed child would be clipped to the bar.
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDrawerFor(null);
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const focusFrame = requestAnimationFrame(() => closeRef.current?.focus());
    const trigger = triggerRef.current;

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      cancelAnimationFrame(focusFrame);
      trigger?.focus();
    };
  }, [open]);

  // Desktop menu: Escape closes it, and so does a click anywhere outside the header.
  useEffect(() => {
    if (!activeMenuKey) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuState(null);
    };
    const onPointerDown = (event: MouseEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setMenuState(null);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [activeMenuKey]);

  const openMenu = (label: string) => setMenuState({ key: label, path: pathname });
  const closeMenu = () => setMenuState(null);

  const drawerGroups = SITE_NAV.map((entry) => {
    if (entry.kind === 'link') return { label: entry.label, links: [{ label: entry.label, href: entry.href }] };
    return {
      label: entry.label,
      links: entry.columns.flatMap((column: NavColumn) => column.links),
    };
  });

  return (
    <header
      ref={headerRef}
      onMouseLeave={closeMenu}
      className="fixed inset-x-0 top-0 z-50 border-b border-gray-100/90 bg-white/95 backdrop-blur-xl"
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-[4.5rem] focus:z-[70] focus:rounded-full focus:bg-[#4c1d95] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center" aria-label="AINOS home">
          <Image
            src="/ainos-wordmark.png"
            alt="AINOS"
            width={100}
            height={34}
            className="h-7 w-auto object-contain sm:h-8"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {SITE_NAV.map((entry) => {
            const active = menuIsActive(pathname, entry);

            if (entry.kind === 'link') {
              return (
                <Link
                  key={entry.href}
                  href={entry.href}
                  aria-current={active ? 'page' : undefined}
                  className={`whitespace-nowrap rounded-full px-3.5 py-2 text-sm transition-colors ${
                    active
                      ? 'font-semibold text-[#4c1d95]'
                      : 'font-medium text-gray-600 hover:bg-purple-50/70 hover:text-gray-950'
                  }`}
                >
                  {entry.label}
                </Link>
              );
            }

            const isOpen = activeMenuKey === entry.label;
            return (
              <button
                key={entry.label}
                type="button"
                onMouseEnter={() => openMenu(entry.label)}
                onClick={() => (isOpen ? closeMenu() : openMenu(entry.label))}
                aria-expanded={isOpen}
                aria-controls={`nav-panel-${slugify(entry.label)}`}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm transition-colors ${
                  isOpen || active
                    ? 'bg-purple-50 font-semibold text-[#4c1d95]'
                    : 'font-medium text-gray-600 hover:bg-purple-50/70 hover:text-gray-950'
                }`}
              >
                {entry.label}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
            );
          })}
        </nav>

        <div className="hidden shrink-0 items-center gap-4 lg:flex">
          <Link href="/auth/signin" className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-950">
            Sign in
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 rounded-full bg-[#4c1d95] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-900/20 transition-colors hover:bg-[#3b0f78]"
          >
            Start 14-day trial <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <button
          ref={triggerRef}
          type="button"
          onClick={() => setDrawerFor(open ? null : pathname)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-purple-50 lg:hidden"
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={open}
          aria-controls="site-drawer"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Desktop dropdown: one panel for the whole bar, aligned to the same
          container as the logo and the page content. */}
      {activeMenu && (
        <div
          id={`nav-panel-${slugify(activeMenu.label)}`}
          className="absolute inset-x-0 top-full hidden max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-purple-100 bg-white shadow-[0_24px_60px_-32px_rgba(76,29,149,0.28)] lg:block"
        >
          <div className="mx-auto flex max-w-7xl gap-10 px-4 py-7 sm:px-6 lg:px-8">
            <div className="flex min-w-0 flex-1 flex-wrap gap-x-10 gap-y-7">
              {activeMenu.columns.map((column) => (
                <div key={column.title} className="w-[190px] shrink-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4c1d95]">
                    {column.title}
                  </p>
                  <ul className="mt-3.5 space-y-0.5">
                    {column.links.map((link) => (
                      <li key={`${column.title}-${link.href}`}>
                        <NavAnchor
                          href={link.href}
                          className={`-mx-2.5 block rounded-lg px-2.5 py-2 text-sm font-medium transition-colors hover:bg-purple-50/80 ${
                            link.href.startsWith('/') && isActive(pathname, link.href)
                              ? 'text-[#4c1d95]'
                              : 'text-gray-700 hover:text-[#4c1d95]'
                          }`}
                        >
                          {link.label}
                          {link.note && (
                            <span className="mt-0.5 block text-xs font-normal leading-relaxed text-gray-500">
                              {link.note}
                            </span>
                          )}
                        </NavAnchor>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="ml-auto hidden w-[264px] shrink-0 xl:block">
              <div className="rounded-2xl border border-purple-100 bg-[#fbf9ff] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5b21b6]">
                  Not sure where to start
                </p>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  A 30-minute walkthrough on your own invoices and stock.
                </p>
                <Link
                  href="/demo"
                  onClick={closeMenu}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#4c1d95] transition-colors hover:text-[#5b21b6]"
                >
                  Book a walkthrough <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <div className="mt-4 border-t border-purple-100 pt-4">
                  <Link
                    href="/pricing"
                    onClick={closeMenu}
                    className="text-sm font-medium text-gray-600 transition-colors hover:text-[#4c1d95]"
                  >
                    See plans and pricing
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Site navigation">
            <div
              aria-hidden="true"
              onClick={() => setDrawerFor(null)}
              className="ainos-drawer-scrim absolute inset-0 bg-gray-950/40 backdrop-blur-[2px]"
            />
            <div
              id="site-drawer"
              ref={panelRef}
              className="ainos-drawer-in absolute right-0 top-0 flex h-[100dvh] w-[min(340px,88vw)] flex-col bg-white shadow-2xl"
            >
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 px-5">
                <Image src="/ainos-wordmark.png" alt="AINOS" width={92} height={32} className="h-7 w-auto" />
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => setDrawerFor(null)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
                  aria-label="Close navigation menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto overscroll-contain px-4 py-5" aria-label="Mobile navigation">
                <ul className="space-y-6">
                  {drawerGroups.map((group) => (
                    <li key={group.label}>
                      <p className="px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4c1d95]">
                        {group.label}
                      </p>
                      <ul className="mt-2 space-y-0.5">
                        {group.links.map((link) => {
                          const active = link.href.startsWith('/') && isActive(pathname, link.href);
                          return (
                            <li key={`${group.label}-${link.href}`}>
                              <NavAnchor
                                href={link.href}
                                className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-[15px] transition-colors ${
                                  active
                                    ? 'bg-purple-50 font-semibold text-[#4c1d95]'
                                    : 'font-medium text-gray-800 hover:bg-gray-50'
                                }`}
                              >
                                {link.label}
                              </NavAnchor>
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="shrink-0 space-y-3 border-t border-gray-100 px-5 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
                <p className="text-center text-[11px] leading-relaxed text-gray-500">
                  GST invoices, Tally files and e-invoice fields are built in.
                </p>
                <Link
                  href="/auth/register"
                  onClick={() => setDrawerFor(null)}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#4c1d95] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-purple-900/20"
                >
                  Start 14-day trial <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/auth/signin"
                  onClick={() => setDrawerFor(null)}
                  className="flex w-full items-center justify-center rounded-full border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-800"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </header>
  );
}
