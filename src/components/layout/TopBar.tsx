'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, Settings, User, Menu, Search, CornerDownLeft } from 'lucide-react';
import { NotificationsBell } from './NotificationsBell';
import { BrandMark } from './BrandMark';
import { DASHBOARD_NAV, NAV_GROUPS, NavItem } from './navigation';

export const OPEN_SIDEBAR_EVENT = 'ainos:open-sidebar';

// Everything the quick search can jump to
const SEARCH_ITEMS: (NavItem & { group: string })[] = [
  { ...DASHBOARD_NAV, group: 'Workspace' },
  ...NAV_GROUPS.flatMap(g => [
    { icon: g.icon, label: `${g.title} overview`, href: g.href, group: g.title },
    ...g.items.map(item => ({ ...item, group: g.title })),
  ]),
  { icon: User, label: 'Company profile', href: '/company', group: 'Account' },
  { icon: Settings, label: 'Settings', href: '/settings', group: 'Account' },
];

function QuickSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    // Split query into words and match ALL words against label or group
    const words = q.split(/\s+/).filter(Boolean);
    return SEARCH_ITEMS.filter(item => {
      const haystack = `${item.label} ${item.group}`.toLowerCase();
      return words.every(w => haystack.includes(w));
    }).slice(0, 7);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setQuery('');
    router.push(href);
  };

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
      <input
        type="search"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); setHighlight(0); }}
        onFocus={() => setOpen(true)}
        onKeyDown={e => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => Math.min(h + 1, results.length - 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)); }
          if (e.key === 'Enter' && results[highlight]) go(results[highlight].href);
          if (e.key === 'Escape') setOpen(false);
        }}
        placeholder="Search anything..."
        aria-label="Search pages"
        className="w-full h-10 pl-10 pr-4 rounded-full bg-[#f5f6f8] text-sm text-neutral-800 placeholder:text-neutral-400 outline-none focus:bg-white focus:ring-2 focus:ring-purple-200 transition"
      />
      <AnimatePresence>
        {open && query.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 top-12 rounded-2xl bg-white shadow-[0_12px_32px_-8px_rgba(16,24,40,0.18)] p-2 z-50"
          >
            {results.length === 0 ? (
              <p className="px-3 py-4 text-sm text-neutral-500 font-light text-center">No pages match “{query}”</p>
            ) : (
              results.map((item, i) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.href}
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => go(item.href)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${i === highlight ? 'bg-purple-50' : ''}`}
                  >
                    <span className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-[#5b21b6]" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-neutral-900 truncate">{item.label}</span>
                      <span className="block text-[11px] text-neutral-400">{item.group}</span>
                    </span>
                    {i === highlight && <CornerDownLeft className="w-3.5 h-3.5 text-neutral-400" />}
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TopBar() {
  const { data: session } = useSession();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = (session?.user?.name || session?.user?.email || 'U')
    .split(/[\s@]+/)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-30 h-16 flex-shrink-0 flex items-center gap-3 px-4 sm:px-6 lg:px-8 bg-white border-b border-neutral-100">
      {/* Mobile: menu + logo */}
      <div className="flex items-center gap-1.5 lg:hidden min-w-0">
        <button
          onClick={() => window.dispatchEvent(new Event(OPEN_SIDEBAR_EVENT))}
          aria-label="Open menu"
          className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-neutral-700 hover:bg-neutral-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <BrandMark />
      </div>

      {/* Desktop: quick search */}
      <div className="hidden lg:flex flex-1">
        <QuickSearch />
      </div>

      <div className="flex-1 lg:hidden" />

      <NotificationsBell />

      {/* Profile */}
      <div ref={profileRef} className="relative">
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          aria-label="Account menu"
          className="w-9 h-9 rounded-full bg-[#5b21b6] hover:bg-[#4c1d95] flex items-center justify-center text-white text-xs font-semibold transition-colors"
        >
          {initials}
        </button>

        <AnimatePresence>
          {profileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-12 w-64 max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden z-50 bg-white shadow-[0_12px_32px_-8px_rgba(16,24,40,0.18)]"
            >
              <div className="p-4 border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-[#5b21b6] text-sm font-medium flex-shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {session?.user?.name || 'User'}
                    </p>
                    <p className="text-xs text-neutral-500 font-light truncate">
                      {session?.user?.email || ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-2 space-y-0.5">
                <Link
                  href="/company"
                  onClick={() => setProfileOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <User className="w-4 h-4 text-neutral-500" />
                  Company profile
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-neutral-500" />
                  Settings
                </Link>
                <div className="border-t border-neutral-100 my-1" />
                <button
                  onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
