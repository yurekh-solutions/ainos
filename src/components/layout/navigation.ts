import { LayoutDashboard, Landmark, Radio, ScrollText, Contact2, Boxes, Coins, FileBarChart, ShoppingCart, PackageCheck, Sheet, BellRing, Paintbrush, Send, AtSign, SearchCheck, PenTool, MailOpen, ShoppingBag, Store, Package, ClipboardList, TrendingUp, Tag, MessageSquare, Users, Terminal, CreditCard, Receipt, UtensilsCrossed, Clock, Layers, Settings, Wrench, BarChart2, Truck, PackageSearch, Car, Warehouse, ShieldCheck, UserCheck, LifeBuoy, CalendarDays, Target, Hammer, KeyRound, CheckSquare, CalendarClock, ReceiptText } from 'lucide-react';

export interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  /** 'advanced' items tuck under an "Advanced" divider; core items show first. */
  tier?: 'core' | 'advanced';
}

export interface NavGroup {
  key: 'finance' | 'billing' | 'marketing' | 'ecommerce' | 'pos' | 'manufacturing' | 'operations' |
    'crm' | 'supply' | 'people' | 'support' | 'workspace';
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
    key: 'crm',
    title: 'CRM',
    shortTitle: 'CRM',
    icon: Target,
    href: '/crm/leads',
    items: [
      { icon: TrendingUp, label: 'Leads', href: '/crm/leads' },
      { icon: Target, label: 'Deals', href: '/crm/deals' },
      { icon: Contact2, label: 'Contacts', href: '/crm/contacts' },
      { icon: MessageSquare, label: 'Follow-ups', href: '/crm/follow-ups' },
    ],
  },
  {
    key: 'supply',
    title: 'Supply Chain',
    shortTitle: 'Stock',
    icon: Warehouse,
    href: '/inventory/stock',
    items: [
      { icon: Boxes, label: 'Stock', href: '/inventory/stock' },
      { icon: ClipboardList, label: 'Purchase Orders', href: '/inventory/orders' },
      { icon: TrendingUp, label: 'Sales Orders', href: '/inventory/sales-orders' },
      { icon: ShoppingCart, label: 'Vendors', href: '/inventory/vendors' },
      { icon: Warehouse, label: 'Warehouses', href: '/inventory/warehouses' },
      { icon: Layers, label: 'Manufacturing', href: '/manufacturing' },
    ],
  },
  {
    key: 'people',
    title: 'People',
    shortTitle: 'Team',
    icon: UserCheck,
    href: '/hr/employees',
    items: [
      { icon: Users, label: 'Employees', href: '/hr/employees' },
      { icon: Clock, label: 'Attendance', href: '/hr/attendance' },
      { icon: CalendarClock, label: 'Planning', href: '/planning' },
      { icon: CalendarDays, label: 'Time Off', href: '/hr/leaves' },
      { icon: CreditCard, label: 'Payroll', href: '/hr/payroll' },
      { icon: UserCheck, label: 'Recruitment', href: '/hr/recruitment' },
      { icon: FileBarChart, label: 'Timesheets', href: '/hr/timesheet' },
    ],
  },
  {
    key: 'support',
    title: 'Support',
    shortTitle: 'Help',
    icon: LifeBuoy,
    href: '/support/helpdesk',
    items: [
      { icon: LifeBuoy, label: 'Helpdesk', href: '/support/helpdesk' },
      { icon: FileBarChart, label: 'Knowledge Base', href: '/support/knowledge-base' },
    ],
  },
  {
    key: 'workspace',
    title: 'Workspace',
    shortTitle: 'Work',
    icon: Layers,
    href: '/projects',
    items: [
      { icon: Layers, label: 'Projects', href: '/projects' },
      { icon: CalendarDays, label: 'Calendar', href: '/calendar' },
      { icon: Users, label: 'Team', href: '/team' },
      { icon: Terminal, label: 'Automations', href: '/automations' },
      { icon: BarChart2, label: 'Reports', href: '/reports' },
      { icon: CheckSquare, label: 'Approvals', href: '/approvals' },
      { icon: ShieldCheck, label: 'Compliance', href: '/compliance/documents' },
    ],
  },
  {
    key: 'finance',
    title: 'Finance',
    shortTitle: 'Money',
    icon: Landmark,
    href: '/dashboard/finance',
    items: [
      { icon: ScrollText, label: 'Invoices', href: '/invoices' },
      { icon: Contact2, label: 'Customers', href: '/customers' },
      { icon: Coins, label: 'Expenses', href: '/finance/expenses' },
      { icon: BellRing, label: 'Pending Payments', href: '/finance/reminders' },
      { icon: Boxes, label: 'Products', href: '/products', tier: 'advanced' },
      { icon: FileBarChart, label: 'Quotations', href: '/finance/quotes', tier: 'advanced' },
      { icon: ShoppingCart, label: 'Purchase Orders', href: '/finance/purchase-orders', tier: 'advanced' },
      { icon: PackageCheck, label: 'Delivery Challans', href: '/finance/challans', tier: 'advanced' },
      { icon: Sheet, label: 'Tally / Excel Export', href: '/finance/tally', tier: 'advanced' },
      { icon: Paintbrush, label: 'Invoice Design', href: '/finance/templates', tier: 'advanced' },
    ],
  },
  {
    key: 'billing',
    title: 'Accounting',
    shortTitle: 'Books',
    icon: Receipt,
    href: '/finance/daybook',
    items: [
      { icon: Sheet, label: 'Daybook', href: '/finance/daybook' },
      { icon: BarChart2, label: 'Profit & Reports', href: '/finance/reports' },
      { icon: FileBarChart, label: 'GST Reports', href: '/finance/gst-reports' },
      { icon: Receipt, label: 'Recurring Invoices', href: '/finance/recurring-invoices', tier: 'advanced' },
      { icon: Landmark, label: 'Bank Accounts', href: '/finance/bank-accounts', tier: 'advanced' },
      { icon: ScrollText, label: 'Credit Notes', href: '/finance/credit-notes', tier: 'advanced' },
      { icon: FileBarChart, label: 'Debit Notes', href: '/finance/debit-notes', tier: 'advanced' },
    ],
  },
  {
    key: 'marketing',
    title: 'Marketing',
    icon: Radio,
    href: '/dashboard/marketing',
    items: [
      { icon: Send, label: 'Email Campaigns', href: '/marketing/campaigns' },
      { icon: AtSign, label: 'Social Media', href: '/marketing/social-media' },
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
    icon: ReceiptText,
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
  {
    key: 'operations',
    title: 'Operations',
    shortTitle: 'Ops',
    icon: Truck,
    href: '/operations/field-service',
    items: [
      { icon: Wrench, label: 'Field Service', href: '/operations/field-service' },
      { icon: PackageSearch, label: 'Maintenance', href: '/operations/maintenance' },
      { icon: Car, label: 'Fleet', href: '/operations/fleet' },
      { icon: ShieldCheck, label: 'Quality', href: '/operations/quality' },
      { icon: Hammer, label: 'Repair', href: '/operations/repair' },
      { icon: KeyRound, label: 'Rental', href: '/rental' },
    ],
  },
];

export const matchesPath = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

/** Dashboard is only active on its own page, not on /dashboard/finance etc. */
export const isDashboardActive = (pathname: string) => pathname === DASHBOARD_NAV.href;

export const isGroupActive = (pathname: string, group: NavGroup) =>
  matchesPath(pathname, group.href) || group.items.some(item => matchesPath(pathname, item.href));
