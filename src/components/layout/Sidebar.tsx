'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Sparkles,
  FileText,
  Users,
  Settings,
  Package,
  ChevronLeft,
  ChevronRight,
  Zap,
  LogOut,
  Building2,
  BarChart3,
  Menu,
  X,
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: FileText, label: 'Invoices', href: '/invoices' },
  { icon: Users, label: 'Customers', href: '/customers' },
  { icon: Package, label: 'Products', href: '/products' },
  { icon: Building2, label: 'Company', href: '/company' },
  { icon: BarChart3, label: 'Reports', href: '/reports' },
  { icon: Sparkles, label: 'Automations', href: '/automations' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  // Close mobile sidebar when pathname changes
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
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <>
      {/* Mobile Header */}
      {!mobileOpen && (
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-panel"
          style={{ borderBottom: '1px solid hsl(var(--sidebar-border) / 0.5)' }}>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold gradient-text">AIONS</h1>
                <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>Smart Billing</p>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-xl transition-colors"
              style={{ background: 'hsl(var(--muted))' }}
            >
              <Menu className="w-5 h-5" style={{ color: 'hsl(var(--foreground))' }} />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
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
            className="lg:hidden fixed top-0 left-0 bottom-0 w-[280px] glass-panel z-[70] flex flex-col"
          >
            {/* Logo */}
            <div className="p-5 flex items-center justify-between"
              style={{ borderBottom: '1px solid hsl(var(--sidebar-border) / 0.5)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold gradient-text">AIONS</h1>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Smart Billing</p>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-xl transition-colors"
                style={{ background: 'hsl(var(--muted))' }}
              >
                <X className="w-5 h-5" style={{ color: 'hsl(var(--foreground))' }} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
                    style={{
                      background: isActive ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                      color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--foreground))'
                    }}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                      isActive ? 'bg-white shadow-md' : 'bg-transparent'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-medium">{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="mobileActiveIndicator"
                        className="ml-auto w-1.5 h-1.5 rounded-full"
                        style={{ background: 'hsl(var(--primary))' }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* User Profile */}
            <div className="p-4 space-y-3" style={{ borderTop: '1px solid hsl(var(--sidebar-border) / 0.5)' }}>
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'hsl(var(--muted))' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>
                  {session?.user?.name?.[0] || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate" style={{ color: 'hsl(var(--foreground))' }}>
                    {session?.user?.name || 'User'}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {session?.user?.email || ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="flex items-center gap-3 px-4 py-3 rounded-xl w-full transition-colors"
                style={{ background: 'hsl(var(--muted))' }}
              >
                <LogOut className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                <span className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>Sign Out</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 260 }}
        className="hidden lg:flex glass-panel h-screen flex-col relative z-50"
      >
        {/* Logo */}
        <div className="p-5 flex items-center gap-3"
          style={{ borderBottom: '1px solid hsl(var(--sidebar-border) / 0.5)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>
            <Zap className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 className="text-xl font-bold gradient-text">AIONS</h1>
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Smart Billing</p>
            </motion.div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group"
                style={{
                  background: isActive ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                }}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${
                  isActive 
                    ? 'bg-white shadow-md' 
                    : 'group-hover:bg-white/50'
                }`}>
                  <Icon 
                    className="w-5 h-5 transition-colors"
                    style={{ color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }} 
                  />
                </div>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-medium text-sm whitespace-nowrap"
                    style={{ color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 rounded-full flex items-center justify-center transition-all shadow-lg"
          style={{ 
            background: 'hsl(var(--card-bg))',
            border: '1px solid hsl(var(--border) / 0.5)',
          }}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" style={{ color: 'hsl(var(--foreground))' }} /> : 
                      <ChevronLeft className="w-4 h-4" style={{ color: 'hsl(var(--foreground))' }} />}
        </button>

        {/* User Profile */}
        <div className="p-3 space-y-2" style={{ borderTop: '1px solid hsl(var(--sidebar-border) / 0.5)' }}>
          <div className="flex items-center gap-3 p-2 rounded-xl" style={{ background: 'hsl(var(--muted))' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>
              {session?.user?.name?.[0] || 'U'}
            </div>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate" style={{ color: 'hsl(var(--foreground))' }}>
                  {session?.user?.name || 'User'}
                </p>
                <p className="text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {session?.user?.email || ''}
                </p>
              </motion.div>
            )}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors w-full ${collapsed ? 'justify-center' : ''}`}
            style={{ background: 'hsl(var(--muted))' }}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
            {!collapsed && <span className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Sign Out</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
