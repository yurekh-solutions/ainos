'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Package,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
  BarChart3,
  Menu,
  X,
  ChevronDown,
  Target,
  UserCheck,
  CalendarDays,
  Wallet,
  CalendarOff,
  Boxes,
  MapPin,
  ShoppingCart,
  Mail,
  ShieldCheck,
  FolderKanban,
  ListTodo,
  GraduationCap,
  MessageSquare,
  Headphones,
  Briefcase,
  Sun,
  Moon,
  UserPlus,
  DollarSign,
  FileSpreadsheet,
  Truck,
  BookOpen,
  Calendar,
  Timer,
  Sparkles,
  Clock,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

interface MenuSection {
  title: string;
  icon: React.ElementType;
  items: MenuItem[];
}

const mainItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: FileText, label: 'Invoices', href: '/invoices' },
  { icon: Users, label: 'Customers', href: '/customers' },
  { icon: Package, label: 'Products', href: '/products' },
  { icon: Calendar, label: 'Calendar', href: '/calendar' },
  { icon: Building2, label: 'Company', href: '/company' },
  { icon: Briefcase, label: 'Services', href: '/services' },
  { icon: DollarSign, label: 'Billing', href: '/billing' },
  { icon: BarChart3, label: 'Reports', href: '/reports' },
  { icon: Sparkles, label: 'Automations', href: '/automations' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

const sections: MenuSection[] = [
  {
    title: 'Sales & CRM',
    icon: Target,
    items: [
      { icon: UserPlus, label: 'Leads', href: '/crm/leads' },
      { icon: Users, label: 'Contacts', href: '/crm/contacts' },
      { icon: Target, label: 'Deals', href: '/crm/deals' },
      { icon: Clock, label: 'Follow-ups', href: '/crm/follow-ups' },
    ],
  },
  {
    title: 'Finance',
    icon: DollarSign,
    items: [
      { icon: DollarSign, label: 'Expenses', href: '/finance/expenses' },
      { icon: FileSpreadsheet, label: 'Quotations', href: '/finance/quotes' },
    ],
  },
  {
    title: 'Projects',
    icon: FolderKanban,
    items: [
      { icon: ListTodo, label: 'Projects & Tasks', href: '/projects' },
    ],
  },
  {
    title: 'HR & Payroll',
    icon: UserCheck,
    items: [
      { icon: Users, label: 'Employees', href: '/hr/employees' },
      { icon: UserPlus, label: 'Recruitment', href: '/hr/recruitment' },
      { icon: CalendarDays, label: 'Attendance', href: '/hr/attendance' },
      { icon: Timer, label: 'Timesheet', href: '/hr/timesheet' },
      { icon: Wallet, label: 'Payroll', href: '/hr/payroll' },
      { icon: CalendarOff, label: 'Leaves', href: '/hr/leaves' },
    ],
  },
  {
    title: 'Inventory',
    icon: Boxes,
    items: [
      { icon: Boxes, label: 'Stock', href: '/inventory/stock' },
      { icon: MapPin, label: 'Warehouses', href: '/inventory/warehouses' },
      { icon: ShoppingCart, label: 'Purchase Orders', href: '/inventory/orders' },
      { icon: Truck, label: 'Sales Orders', href: '/inventory/sales-orders' },
      { icon: Building2, label: 'Vendors', href: '/inventory/vendors' },
    ],
  },
  {
    title: 'Marketing',
    icon: Mail,
    items: [
      { icon: Mail, label: 'Email Campaigns', href: '/marketing/email' },
      { icon: FileText, label: 'Blog & Content', href: '/marketing/blog' },
    ],
  },
  {
    title: 'Compliance',
    icon: ShieldCheck,
    items: [
      { icon: CalendarDays, label: 'Calendar', href: '/compliance/calendar' },
      { icon: FileText, label: 'Documents', href: '/compliance/documents' },
    ],
  },
  {
    title: 'AI Studio',
    icon: MessageSquare,
    items: [
      { icon: MessageSquare, label: 'Chat', href: '/ai/chat' },
      { icon: Sparkles, label: 'Media Studio', href: '/ai/media' },
      { icon: GraduationCap, label: 'AI Skills', href: '/ai/skills' },
    ],
  },
  {
    title: 'Support',
    icon: Headphones,
    items: [
      { icon: Headphones, label: 'Helpdesk', href: '/support/helpdesk' },
      { icon: BookOpen, label: 'Knowledge Base', href: '/support/knowledge-base' },
    ],
  },
];

function SectionGroup({
  section,
  collapsed,
  pathname,
}: {
  section: MenuSection;
  collapsed: boolean;
  pathname: string;
}) {
  const SectionIcon = section.icon;
  const hasActive = section.items.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  const [open, setOpen] = useState(hasActive);

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <SectionIcon className="w-4 h-4 flex-shrink-0 text-gray-500 dark:text-gray-400" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left text-xs font-medium text-gray-600 dark:text-gray-400">
              {section.title}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      <AnimatePresence>
        {open && !collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="pl-9 pr-3 py-1 space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{item.label}</span>
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

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();

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
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <img src="/icon.png" alt="AINOS" className="w-8 h-8 rounded-lg" />
              <div>
                <h1 className="text-base font-bold text-gray-900 dark:text-white">AINOS</h1>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Business Suite</p>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
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
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
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
            className="lg:hidden fixed top-0 left-0 bottom-0 w-[280px] bg-white dark:bg-gray-900 z-[70] flex flex-col border-r border-gray-200 dark:border-gray-800"
          >
            {/* Logo */}
            <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <img src="/icon.png" alt="AINOS" className="w-9 h-9 rounded-lg" />
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">AINOS</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Business Suite</p>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {mainItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 font-medium'
                        : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}

              <div className="pt-3 space-y-1">
                {sections.map((section) => (
                  <SectionGroup
                    key={section.title}
                    section={section}
                    collapsed={false}
                    pathname={pathname}
                  />
                ))}
              </div>
            </nav>

            {/* User Profile */}
            <div className="p-3 space-y-2 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-3 px-3 py-2 rounded-lg w-full hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <span className="text-sm">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white text-sm font-medium">
                  {session?.user?.name?.[0] || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {session?.user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {session?.user?.email || ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/ainos/auth/signin/' })}
                className="flex items-center gap-3 px-3 py-2 rounded-lg w-full hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 256 }}
        className="hidden lg:flex bg-white dark:bg-gray-900 h-screen flex-col relative z-50 border-r border-gray-200 dark:border-gray-800"
      >
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-gray-200 dark:border-gray-800">
          <img src="/icon.png" alt="AINOS" className="w-9 h-9 rounded-lg flex-shrink-0" />
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">AINOS</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Business Suite</p>
            </motion.div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {mainItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                  isActive
                    ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 font-medium'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeBar"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-purple-600"
                  />
                )}
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </Link>
            );
          })}

          <div className="pt-3 space-y-1">
            {sections.map((section) => (
              <SectionGroup
                key={section.title}
                section={section}
                collapsed={collapsed}
                pathname={pathname}
              />
            ))}
          </div>
        </nav>

        {/* Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
          )}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="absolute -right-3 top-[calc(50%+28px)] w-6 h-6 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-3 h-3 text-gray-600 dark:text-gray-400" />
          ) : (
            <Moon className="w-3 h-3 text-gray-600 dark:text-gray-400" />
          )}
        </button>

        {/* User Profile */}
        <div className="p-3 space-y-2 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
              {session?.user?.name?.[0] || 'U'}
            </div>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {session?.user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {session?.user?.email || ''}
                </p>
              </motion.div>
            )}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/ainos/auth/signin/' })}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors w-full ${
              collapsed ? 'justify-center' : ''
            } hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="text-sm">Sign Out</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
