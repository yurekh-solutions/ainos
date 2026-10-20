'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, Settings, User, Menu } from 'lucide-react';
import { NotificationsBell } from './NotificationsBell';

export const OPEN_SIDEBAR_EVENT = 'ainos:open-sidebar';

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
    <header className="sticky top-0 z-30 h-16 flex-shrink-0 flex items-center gap-3 px-4 sm:px-6 bg-white border-b border-neutral-200">
      {/* Mobile: menu + logo */}
      <div className="flex items-center gap-2 lg:hidden">
        <button
          onClick={() => window.dispatchEvent(new Event(OPEN_SIDEBAR_EVENT))}
          aria-label="Open menu"
          className="w-10 h-10 -ml-2 rounded-xl flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src="/ainos.jpg" alt="AINOS" className="w-8 h-8 rounded-lg object-cover" />
          <span className="text-base font-semibold text-neutral-900">AINOS</span>
        </Link>
      </div>

      <div className="flex-1" />

      <NotificationsBell />

      {/* Profile */}
      <div ref={profileRef} className="relative">
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          aria-label="Account menu"
          className="w-9 h-9 rounded-full bg-[#5b21b6] hover:bg-[#4c1d95] flex items-center justify-center text-white text-sm font-medium transition-colors"
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
              className="absolute right-0 top-12 w-64 max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden z-50 bg-white border border-neutral-200 shadow-lg shadow-neutral-900/5"
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
