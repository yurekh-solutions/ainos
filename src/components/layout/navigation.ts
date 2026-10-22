import {
  LayoutDashboard, Landmark, Radio,
  ScrollText, Contact2, Boxes, Coins, FileBarChart, ShoppingCart, PackageCheck, Sheet, BellRing, Paintbrush,
  Send, AtSign, SearchCheck, PenTool, MailOpen,
  ShoppingBag, Store, Package, ClipboardList, TrendingUp, Tag, MessageSquare, Users,
  Terminal, CreditCard, Receipt, UtensilsCrossed, Clock,
  Layers, Settings, Wrench, BarChart2,
} from 'lucide-react';

export interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

export interface NavGroup {
  key: 'finance' | 'marketing' | 'ecommerce' | 'pos' | 'manufacturing';
  title: string;
  /** Compact label for the mobile bottom nav (max ~9 chars) */
  shortTitle?: string;
  icon: React.ElementType;
  /** Overview page for the whole group */
  href: string;
  items: NavItem[];
}

export const DASHBOARD_NAV: NavItem = { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' };

export const NAV_GROUPS: NavGroup[] = [
  {
    key: 'finance',
    title: 'Finance',
    shortTitle: 'Money',
    icon: Landmark,
    href: '/dashboard/finance',
    items: [
      { icon: ScrollText, label: 'Invoices', href: '/invoices' },
      { icon: Contact2, label: 'Customers', href: '/customers' },
      { icon: Boxes, label: 'Products', href: '/products' },
      { icon: Coins, label: 'Expenses', href: '/finance/expenses' },
      { icon: FileBarChart, label: 'Quotations', href: '/finance/quotes' },
      { icon: ShoppingCart, label: 'Purchase Orders', href: '/finance/purchase-orders' },
      { icon: PackageCheck, label: 'Delivery Challans', href: '/finance/challans' },
      { icon: Sheet, label: 'Tally / Excel', href: '/finance/tally' },
      { icon: BellRing, label: 'Payment Reminders', href: '/finance/reminders' },
      { icon: Paintbrush, label: 'Template Designer', href: '/finance/templates' },
    ],
  },
  {
    key: 'marketing',
    title: 'Marketing',
    icon: Radio,
    href: '/dashboard/marketing',
    items: [
      { icon: Send, label: 'Email Campaigns', href: '/marketing/campaigns' },
      { icon: AtSign, label: 'Social Media', href: '/marketing/email' },
      { icon: SearchCheck, label: 'SEO Platform', href: '/marketing/seo' },
      { icon: PenTool, label: 'Blog & Content', href: '/marketing/blog' },
      { icon: MailOpen, label: 'Invitations', href: '/marketing/invitations' },
    ],
  },
  {
    key: 'ecommerce',
    title: 'eCommerce',
    shortTitle: 'Store',
    icon: ShoppingBag,
    href: '/ecommerce/stores',
    items: [
      { icon: Store, label: 'Stores', href: '/ecommerce/stores' },
      { icon: Package, label: 'Products', href: '/ecommerce/products' },
      { icon: ClipboardList, label: 'Orders', href: '/ecommerce/orders' },
      { icon: Users, label: 'Customers', href: '/ecommerce/customers' },
      { icon: TrendingUp, label: 'Analytics', href: '/ecommerce/analytics' },
      { icon: Tag, label: 'Coupons', href: '/ecommerce/coupons' },
      { icon: MessageSquare, label: 'Reviews', href: '/ecommerce/reviews' },
      { icon: Settings, label: 'Settings', href: '/ecommerce/settings' },
    ],
  },
  {
    key: 'pos',
    title: 'Point of Sale',
    shortTitle: 'Billing',
    icon: Terminal,
    href: '/pos/sessions',
    items: [
      { icon: Clock, label: 'Sessions', href: '/pos/sessions' },
      { icon: CreditCard, label: 'Register', href: '/pos/register' },
      { icon: Receipt, label: 'Orders', href: '/pos/orders' },
      { icon: UtensilsCrossed, label: 'Products', href: '/pos/products' },
      { icon: BarChart2, label: 'Reports', href: '/pos/reports' },
    ],
  },
  {
    key: 'manufacturing',
    title: 'Manufacturing',
    icon: Wrench,
    href: '/manufacturing',
    items: [
      { icon: Layers, label: 'All Modules', href: '/manufacturing' },
    ],
  },
];

export const matchesPath = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

/** Dashboard is only active on its own page, not on /dashboard/finance etc. */
export const isDashboardActive = (pathname: string) => pathname === DASHBOARD_NAV.href;

export const isGroupActive = (pathname: string, group: NavGroup) =>
  matchesPath(pathname, group.href) || group.items.some(item => matchesPath(pathname, item.href));
