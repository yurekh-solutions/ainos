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
  X,
  ChevronDown,
  Target,
  UserCheck,
  CalendarDays,
  Wallet,
  CalendarOff,
  Boxes,
  MapPin,
  Globe,
  ShoppingCart,
  Mail,
  ShieldCheck,
  FolderKanban,
  ListTodo,
  GraduationCap,
  MessageSquare,
  Headphones,
  Briefcase,
  UserPlus,
  DollarSign,
  FileSpreadsheet,
  Truck,
  BookOpen,
  Calendar,
  Timer,
  Sparkles,
  Clock,
  Zap,
  Send,
  Heart,
  Bell,
  Palette,
  Landmark,
  Radio,
  Hash,
} from 'lucide-react';
import { OPEN_SIDEBAR_EVENT } from './TopBar';

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
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
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
    icon: Landmark,
    items: [
      { icon: FileText, label: 'Invoices', href: '/invoices' },
      { icon: Users, label: 'Customers', href: '/customers' },
      { icon: Package, label: 'Products', href: '/products' },
      { icon: Wallet, label: 'Expenses', href: '/finance/expenses' },
      { icon: FileSpreadsheet, label: 'Quotations', href: '/finance/quotes' },
      { icon: ShoppingCart, label: 'Purchase Orders', href: '/finance/purchase-orders' },
      { icon: Truck, label: 'Delivery Challans', href: '/finance/challans' },
      { icon: FileSpreadsheet, label: 'Tally / Excel', href: '/finance/tally' },
      { icon: Bell, label: 'Payment Reminders', href: '/finance/reminders' },
      { icon: Palette, label: 'Template Designer', href: '/finance/templates' },
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
      { icon: Users, label: 'Team', href: '/team' },
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
    icon: Radio,
    items: [
      { icon: Mail, label: 'Email Campaigns', href: '/marketing/campaigns' },
      { icon: Hash, label: 'Social Media', href: '/marketing/email' },
      { icon: Globe, label: 'SEO Platform', href: '/marketing/seo' },
      { icon: FileText, label: 'Blog & Content', href: '/marketing/blog' },
      { icon: Send, label: 'Invitations', href: '/marketing/invitations' },
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
      { icon: Zap, label: 'Video Effects', href: '/ai/effects' },
      { icon: GraduationCap, label: 'AI Skills', href: '/ai/skills' },
      { icon: Heart, label: 'Projects Gallery', href: '/ai/projects' },
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

// Focused mode: Dashboard + Marketing + Accounts (Finance) only.
// Other sections (CRM, HR, Inventory, Projects, Support, Compliance, AI) are hidden.
const visibleMainItems = mainItems.filter((item) => item.href === '/dashboard');
const visibleSections = sections.filter((section) =>
  section.title === 'Marketing' || section.title === 'Finance'
);

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
        className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl transition-colors hover:bg-neutral-50"
      >
        <SectionIcon className="w-4 h-4 flex-shrink-0 text-neutral-500" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left text-sm font-medium text-neutral-800">
              {section.title}
            </span>
            <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`} />
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
            <div className="pl-6 pr-1 py-1 space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${
                      isActive
                        ? 'bg-purple-50 text-[#5b21b6] font-medium'
                        : 'text-neutral-600 font-light hover:bg-neutral-50 hover:text-neutral-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#5b21b6]' : 'text-neutral-400'}`} />
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
  const routerPathname = usePathname();
  // Defer pathname to client-only to prevent hydration mismatch
  const [pathname, setPathname] = useState('');
  useEffect(() => { setPathname(routerPathname); }, [routerPathname]);
  const { data: session } = useSession();

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
            className="lg:hidden fixed inset-0 bg-neutral-900/40 z-[60]"
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
            className="lg:hidden fixed top-0 left-0 bottom-0 w-[85vw] max-w-[300px] bg-white z-[70] flex flex-col border-r border-neutral-200"
          >
            {/* Logo */}
            <div className="h-16 px-4 flex items-center justify-between border-b border-neutral-200">
              <Link href="/dashboard" className="flex items-center gap-3">
                <img src="/ainos.jpg" alt="AINOS" className="w-9 h-9 rounded-lg object-cover" />
                <div>
                  <h1 className="text-base font-semibold text-neutral-900">AINOS</h1>
                  <p className="text-xs text-neutral-500 font-light">Business Suite</p>
                </div>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-neutral-100"
              >
                <X className="w-5 h-5 text-neutral-600" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {visibleMainItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-purple-50 text-[#5b21b6] font-medium'
                        : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}

              <div className="pt-3 space-y-1">
                {visibleSections.map((section) => (
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
            <div className="p-3 space-y-2 border-t border-neutral-200">
              <div className="flex items-center gap-3 p-2 rounded-xl bg-neutral-50">
                <div className="w-8 h-8 rounded-full bg-[#5b21b6] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                  {session?.user?.name?.[0] || 'U'}
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
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full hover:bg-neutral-50 text-neutral-700"
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
        className="hidden lg:flex bg-white h-screen flex-shrink-0 flex-col relative z-40 border-r border-neutral-200"
      >
        {/* Logo */}
        <Link href="/dashboard" className="h-16 px-4 flex items-center gap-3 border-b border-neutral-200">
          <img src="/ainos.jpg" alt="AINOS" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 className="text-base font-semibold text-neutral-900">AINOS</h1>
              <p className="text-xs text-neutral-500 font-light">Business Suite</p>
            </motion.div>
          )}
        </Link>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {visibleMainItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group ${
                  isActive
                    ? 'bg-purple-50 text-[#5b21b6] font-medium'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#5b21b6]' : 'text-neutral-500'}`} />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm whitespace-nowrap font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </Link>
            );
          })}

          <div className="pt-3 space-y-1">
            {visibleSections.map((section) => (
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
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-neutral-200 flex items-center justify-center hover:border-purple-200 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 text-neutral-500" />
          )}
        </button>

        {/* User Profile */}
        <div className="p-3 space-y-2 border-t border-neutral-200">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-neutral-50">
            <div className="w-8 h-8 rounded-full bg-[#5b21b6] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
              {session?.user?.name?.[0] || 'U'}
            </div>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {session?.user?.name || 'User'}
                </p>
                <p className="text-xs text-neutral-500 font-light truncate">
                  {session?.user?.email || ''}
                </p>
              </motion.div>
            )}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors w-full ${
              collapsed ? 'justify-center' : ''
            } hover:bg-neutral-50 text-neutral-700`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="text-sm">Sign Out</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
