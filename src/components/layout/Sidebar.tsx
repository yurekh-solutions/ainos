'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Workflow,
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
  CreditCard,
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/', color: 'text-indigo-400' },
  { icon: FileText, label: 'Invoices', href: '/invoices', color: 'text-purple-400' },
  { icon: Users, label: 'Customers', href: '/customers', color: 'text-pink-400' },
  { icon: Package, label: 'Products', href: '/products', color: 'text-amber-400' },
  { icon: Building2, label: 'Company', href: '/company', color: 'text-emerald-400' },
  { icon: BarChart3, label: 'Reports', href: '/reports', color: 'text-cyan-400' },
  { icon: Workflow, label: 'Workflows', href: '/workflows', color: 'text-violet-400' },
  { icon: Settings, label: 'Settings', href: '/settings', color: 'text-gray-400' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      className="glass-panel h-screen flex flex-col relative z-50"
    >
      {/* Logo */}
      <div className="p-6 flex items-center gap-3 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <Zap className="w-6 h-6 text-white" />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h1 className="text-xl font-bold gradient-text">IANOS</h1>
            <p className="text-xs text-white/50">Billing Suite</p>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${isActive 
                  ? 'bg-white/10 text-white shadow-lg shadow-indigo-500/20' 
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
                }
              `}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? item.color : ''}`} />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-medium text-sm whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
              {isActive && !collapsed && (
                <motion.div
                  layoutId="activeIndicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 glass rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* User Profile */}
      <div className="p-4 border-t border-white/10 space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">
              {session?.user?.name?.[0] || 'U'}
            </span>
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="min-w-0 flex-1"
            >
              <p className="text-white font-medium text-sm truncate">{session?.user?.name || 'User'}</p>
              <p className="text-white/50 text-xs truncate">{session?.user?.email || ''}</p>
            </motion.div>
          )}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          className={`flex items-center gap-3 px-4 py-2 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-all w-full ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </motion.aside>
  );
}
