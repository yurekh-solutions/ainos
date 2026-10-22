'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';
import { ChevronLeft, ChevronRight, ChevronDown, LogOut, X } from 'lucide-react';
import { OPEN_SIDEBAR_EVENT } from './TopBar';
import { BrandMark } from './BrandMark';
import { DASHBOARD_NAV, NAV_GROUPS, NavGroup, isDashboardActive, isGroupActive, matchesPath } from './navigation';

// Deep indigo surface with one violet highlight for the active row
const SURFACE = 'bg-gradient-to-b from-[#1d1752] via-[#18134a] to-[#120e36]';
const ROW = 'flex items-center gap-3 px-3 h-11 rounded-xl text-sm transition-colors';
const ROW_ACTIVE = 'bg-[#6d28d9] text-white font-medium shadow-[0_8px_18px_-8px_rgba(124,58,237,0.8)]';
const ROW_IDLE = 'text-white/70 hover:bg-white/[0.06] hover:text-white';

// Premium icon backgrounds with gradient circles
const ICON_BG_COLORS = [
  'bg-gradient-to-br from-violet-500 to-purple-600',
  'bg-gradient-to-br from-blue-500 to-indigo-600',
  'bg-gradient-to-br from-emerald-500 to-teal-600',
  'bg-gradient-to-br from-orange-500 to-red-600',
  'bg-gradient-to-br from-pink-500 to-rose-600',
  'bg-gradient-to-br from-cyan-500 to-blue-600',
];

function getIconBg(index: number) {
  return ICON_BG_COLORS[index % ICON_BG_COLORS.length];
}

const subscribeNoop = () => () => {};

function initialsOf(name?: string | null, email?: string | null) {
  return (name || email || 'U')
    .split(/[\s@]+/)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function GroupNav({ group, collapsed, pathname }: { group: NavGroup; collapsed: boolean; pathname: string }) {
  const Icon = group.icon;
  const active = isGroupActive(pathname, group);
  const onOverview = matchesPath(pathname, group.href);
  // Follows the route until the user toggles it manually
  const [toggled, setToggled] = useState<boolean | null>(null);
  const open = toggled ?? active;

  if (collapsed) {
    return (
      <Link href={group.href} title={group.title} className={`${ROW} justify-center ${active ? ROW_ACTIVE : ROW_IDLE}`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? 'bg-white/20' : getIconBg(0)}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </Link>
    );
  }

  return (
    <div>
      <div className={`flex items-center rounded-xl transition-colors ${onOverview ? ROW_ACTIVE : active ? 'bg-white/[0.06] text-white' : ROW_IDLE}`}>
        <Link href={group.href} className="flex-1 flex items-center gap-3 pl-3 h-11 text-sm font-medium min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${onOverview || active ? 'bg-white/20' : getIconBg(0)}`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <span className="truncate">{group.title}</span>
        </Link>
        <button
          type="button"
          onClick={() => setToggled(!open)}
          aria-label={`${open ? 'Collapse' : 'Expand'} ${group.title}`}
          aria-expanded={open}
          className="w-10 h-11 flex items-center justify-center flex-shrink-0 opacity-80 hover:opacity-100"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="ml-5 pl-3 my-1 border-l border-white/10 space-y-0.5">
              {group.items.map((item, idx) => {
                const ItemIcon = item.icon;
                const itemActive = matchesPath(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 h-9 rounded-lg text-[13px] transition-colors ${
                      itemActive ? 'bg-white/10 text-white font-medium' : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center ${itemActive ? 'bg-white/20' : getIconBg(idx + 1)}`}>
                      <ItemIcon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavList({ collapsed, pathname }: { collapsed: boolean; pathname: string }) {
  const DashIcon = DASHBOARD_NAV.icon;
  const dashActive = isDashboardActive(pathname);
  return (
    <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
      <Link
        href={DASHBOARD_NAV.href}
        title={collapsed ? DASHBOARD_NAV.label : undefined}
        className={`${ROW} ${collapsed ? 'justify-center' : ''} ${dashActive ? ROW_ACTIVE : ROW_IDLE}`}
      >
        <DashIcon className="w-5 h-5 flex-shrink-0" />
        {!collapsed && <span className="font-medium">{DASHBOARD_NAV.label}</span>}
      </Link>
      {NAV_GROUPS.map(group => (
        <GroupNav key={group.key} group={group} collapsed={collapsed} pathname={pathname} />
      ))}
    </nav>
  );
}

function UserFooter({ collapsed }: { collapsed: boolean }) {
  const { data: session } = useSession();
  return (
    <div className="p-3 space-y-1.5 border-t border-white/10">
      <div className={`flex items-center gap-3 p-2 rounded-xl bg-white/[0.06] ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 rounded-full bg-[#7c3aed] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
          {initialsOf(session?.user?.name, session?.user?.email)}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{session?.user?.name || 'User'}</p>
            <p className="text-[11px] text-white/50 font-light truncate">{session?.user?.email || ''}</p>
          </div>
        )}
      </div>
      <button
        onClick={() => signOut({ callbackUrl: '/auth/signin' })}
        title={collapsed ? 'Sign Out' : undefined}
        className={`${ROW} w-full ${collapsed ? 'justify-center' : ''} ${ROW_IDLE}`}
      >
        <LogOut className="w-4 h-4 flex-shrink-0" />
        {!collapsed && <span>Sign Out</span>}
      </button>
    </div>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const routerPathname = usePathname();
  // Defer pathname to client-only to prevent hydration mismatch
  const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const pathname = isClient ? routerPathname || '' : '';

  useEffect(() => {
    if (mobileOpen) {
      const timer = setTimeout(() => setMobileOpen(false), 0);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    const handleOpen = () => setMobileOpen(true);
    window.addEventListener('keydown', handleEscape);
    window.addEventListener(OPEN_SIDEBAR_EVENT, handleOpen);
    return () => {
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener(OPEN_SIDEBAR_EVENT, handleOpen);
    };
  }, []);

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-neutral-900/50 z-[60]"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`lg:hidden fixed top-0 left-0 bottom-0 w-[85vw] max-w-[300px] z-[70] flex flex-col ${SURFACE}`}
          >
            <div className="h-16 px-4 flex items-center justify-between border-b border-white/10">
              <BrandMark tone="dark" />
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <NavList collapsed={false} pathname={pathname} />
            <UserFooter collapsed={false} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 76 : 256 }}
        className={`hidden lg:flex h-screen flex-shrink-0 flex-col relative z-40 ${SURFACE}`}
      >
        <div className={`h-16 flex items-center border-b border-white/10 ${collapsed ? 'justify-center px-2' : 'px-5'}`}>
          <BrandMark tone="dark" showText={!collapsed} />
        </div>

        <NavList collapsed={collapsed} pathname={pathname} />

        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center hover:text-[#5b21b6] text-neutral-500 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        <UserFooter collapsed={collapsed} />
      </motion.aside>
    </>
  );
}
