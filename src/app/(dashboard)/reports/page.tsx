'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Users, Package, BarChart3, PieChart } from 'lucide-react';

interface ReportData {
  invoices: { total: number; paid: number; pending: number; overdue: number; revenue: number };
  customers: { total: number; active: number };
  crm: { contacts: number; deals: number; pipelineValue: number; wonDeals: number };
  hr: { employees: number; monthlyCost: number; presentToday: number };
  inventory: { totalItems: number; lowStock: number; stockValue: number };
  marketing: { campaigns: number; totalRecipients: number };
  compliance: { pending: number; overdue: number };
  support: { openTickets: number; urgentTickets: number };
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    try {
      const [invRes, custRes, contactRes, dealRes, empRes, stockRes, campRes, compRes, helpRes] = await Promise.all([
        fetch('/api/invoices'), fetch('/api/customers'), fetch('/api/contacts'),
        fetch('/api/deals'), fetch('/api/employees'), fetch('/api/stock'),
        fetch('/api/email-campaigns'), fetch('/api/compliance'), fetch('/api/helpdesk')
      ]);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invoices: any[] = invRes.ok ? await invRes.json() : [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const customers: any[] = custRes.ok ? await custRes.json() : [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contacts: any[] = contactRes.ok ? await contactRes.json() : [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dealData: any = dealRes.ok ? await dealRes.json() : { deals: [], stats: {} };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const employees: any[] = empRes.ok ? await empRes.json() : [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stockData: any = stockRes.ok ? await stockRes.json() : { items: [] };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stock: any[] = Array.isArray(stockData) ? stockData : (Array.isArray(stockData?.items) ? stockData.items : []);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const campaignsData: any = campRes.ok ? await campRes.json() : [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const campaigns: any[] = Array.isArray(campaignsData) ? campaignsData : (Array.isArray(campaignsData?.campaigns) ? campaignsData.campaigns : []);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const complianceData: any = compRes.ok ? await compRes.json() : [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const compliance: any[] = Array.isArray(complianceData) ? complianceData : (Array.isArray(complianceData?.tasks) ? complianceData.tasks : (Array.isArray(complianceData?.items) ? complianceData.items : []));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const helpdeskData: any = helpRes.ok ? await helpRes.json() : [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const helpdesk: any[] = Array.isArray(helpdeskData) ? helpdeskData : (Array.isArray(helpdeskData?.tickets) ? helpdeskData.tickets : (Array.isArray(helpdeskData?.items) ? helpdeskData.items : []));

      setData({
        invoices: {
          total: invoices.length,
          paid: invoices.filter((i: any) => i.status === 'paid').length,
          pending: invoices.filter((i: any) => i.status === 'pending').length,
          overdue: invoices.filter((i: any) => i.status === 'overdue').length,
          revenue: invoices.reduce((s: number, i: any) => s + (i.total || 0), 0)
        },
        customers: { total: customers.length, active: customers.filter((c: any) => c.status === 'active').length },
        crm: { contacts: contacts.length, deals: dealData.deals?.length || 0, pipelineValue: dealData.stats?.totalValue || 0, wonDeals: dealData.stats?.byStage?.won || 0 },
        hr: { employees: employees.length, monthlyCost: employees.reduce((s: number, e: any) => s + (e.salary || 0), 0), presentToday: 0 },
        inventory: { totalItems: stock.length, lowStock: stockData.lowStockCount || stock.filter((s: any) => s.quantity <= s.reorderLevel).length, stockValue: stock.reduce((s: number, i: any) => s + ((i.quantity || 0) * (i.unitCost || 0)), 0) },
        marketing: { campaigns: campaigns.length, totalRecipients: campaigns.reduce((s: number, c: any) => s + (c.recipients || 0), 0) },
        compliance: { pending: compliance.filter((t: any) => t.status === 'pending').length, overdue: compliance.filter((t: any) => t.status === 'pending' && new Date(t.dueDate) < new Date()).length },
        support: { openTickets: helpdesk.filter((t: any) => t.status === 'open').length, urgentTickets: helpdesk.filter((t: any) => t.priority === 'urgent').length }
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading || !data) return <div className="min-h-screen flex items-center justify-center" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading reports...</div>;

  const metrics = [
    { label: 'Total Revenue', value: `Rs.${data.invoices.revenue.toLocaleString('en-IN')}`, icon: DollarSign, color: 'hsl(252 60% 55%)', change: '+12%' },
    { label: 'Active Customers', value: data.customers.active, icon: Users, color: '#34d399', change: '+5%' },
    { label: 'Pipeline Value', value: `Rs.${data.crm.pipelineValue.toLocaleString('en-IN')}`, icon: TrendingUp, color: '#a78bfa', change: '+18%' },
    { label: 'Stock Value', value: `Rs.${data.inventory.stockValue.toLocaleString('en-IN')}`, icon: Package, color: '#94a3b8', change: '-3%' },
  ];

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Smart Reports</h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Business intelligence & analytics</p>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <m.icon className="w-5 h-5" style={{ color: m.color }} />
                <span className="text-xs font-medium text-emerald-400">{m.change}</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</p>
              <p className="text-xs font-medium uppercase tracking-wider mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{m.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Module Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sales & CRM */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
              <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>Sales & CRM</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center"><span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Contacts</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{data.crm.contacts}</span></div>
              <div className="flex justify-between items-center"><span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Active Deals</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{data.crm.deals}</span></div>
              <div className="flex justify-between items-center"><span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Won Deals</span><span className="text-sm font-semibold text-emerald-400">{data.crm.wonDeals}</span></div>
              <div className="flex justify-between items-center"><span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Win Rate</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--primary))' }}>{data.crm.deals ? ((data.crm.wonDeals / data.crm.deals) * 100).toFixed(1) : 0}%</span></div>
            </div>
          </motion.div>

          {/* Invoices */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>Invoicing</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center"><span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Invoices</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{data.invoices.total}</span></div>
              <div className="flex justify-between items-center"><span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Paid</span><span className="text-sm font-semibold text-emerald-400">{data.invoices.paid}</span></div>
              <div className="flex justify-between items-center"><span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Pending</span><span className="text-sm font-semibold text-[#a78bfa]">{data.invoices.pending}</span></div>
              <div className="flex justify-between items-center"><span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Overdue</span><span className="text-sm font-semibold text-[#94a3b8]">{data.invoices.overdue}</span></div>
            </div>
          </motion.div>

          {/* HR */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-[#a78bfa]" />
              <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>HR & Payroll</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center"><span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Employees</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{data.hr.employees}</span></div>
              <div className="flex justify-between items-center"><span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Monthly Cost</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--primary))' }}>Rs.{data.hr.monthlyCost.toLocaleString('en-IN')}</span></div>
            </div>
          </motion.div>

          {/* Inventory */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-[#94a3b8]" />
              <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>Inventory</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center"><span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Items</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{data.inventory.totalItems}</span></div>
              <div className="flex justify-between items-center"><span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Low Stock</span><span className="text-sm font-semibold text-[#a78bfa]">{data.inventory.lowStock}</span></div>
              <div className="flex justify-between items-center"><span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Stock Value</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--primary))' }}>Rs.{data.inventory.stockValue.toLocaleString('en-IN')}</span></div>
            </div>
          </motion.div>
        </div>

        {/* Alerts */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
            <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>Action Items</h2>
          </div>
          <div className="space-y-3">
            {data.compliance.overdue > 0 && <div className="flex items-center gap-3 p-3 rounded-xl bg-[#94a3b8]/10"><span className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>{data.compliance.overdue} overdue compliance task(s)</span></div>}
            {data.inventory.lowStock > 0 && <div className="flex items-center gap-3 p-3 rounded-xl bg-[#a78bfa]/10"><span className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>{data.inventory.lowStock} low stock item(s) need reorder</span></div>}
            {data.invoices.overdue > 0 && <div className="flex items-center gap-3 p-3 rounded-xl bg-[#94a3b8]/10"><span className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>{data.invoices.overdue} overdue invoice(s) need follow-up</span></div>}
            {data.support.urgentTickets > 0 && <div className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(var(--primary))]/10"><span className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>{data.support.urgentTickets} urgent support ticket(s)</span></div>}
            {data.compliance.overdue === 0 && data.inventory.lowStock === 0 && data.invoices.overdue === 0 && data.support.urgentTickets === 0 && (
              <p className="text-sm text-center py-4" style={{ color: 'hsl(var(--muted-foreground))' }}>All clear! No urgent action items.</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
