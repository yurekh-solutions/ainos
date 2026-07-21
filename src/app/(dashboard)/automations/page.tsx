'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, Bell, Mail, FileText, UserPlus, Package, Settings, Clock,
  CheckCircle2, TrendingUp, Users, Briefcase, ShieldCheck, Headphones,
  BarChart3, Zap, Plus, Trash2, Activity
} from 'lucide-react';

const MODULE_ICONS: Record<string, React.ElementType> = {
  invoicing: FileText, crm: Users, hr: Briefcase, inventory: Package,
  marketing: TrendingUp, compliance: ShieldCheck, support: Headphones,
  ai: Sparkles, reports: BarChart3,
};

const MODULE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  invoicing: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/30' },
  crm: { bg: 'bg-violet-500/10', text: 'text-violet-500', border: 'border-violet-500/30' },
  hr: { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/30' },
  inventory: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-500/30' },
  marketing: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/30' },
  compliance: { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/30' },
  support: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/30' },
  ai: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/30' },
  reports: { bg: 'bg-teal-500/10', text: 'text-teal-500', border: 'border-teal-500/30' },
};

interface Automation {
  _id?: string;
  id?: string;
  name: string;
  description: string;
  module: string;
  trigger: { type: string; event?: string; schedule?: string; condition?: Record<string, unknown> };
  actions: Array<{ type: string; config: Record<string, unknown> }>;
  enabled: boolean;
  runCount?: number;
  successCount?: number;
  lastRun?: string;
}

const TEMPLATES: Automation[] = [
  { id: 'inv-remind', name: 'Overdue Invoice Reminders', description: 'Send reminders for overdue invoices', module: 'invoicing', trigger: { type: 'schedule', schedule: 'Daily at 9 AM' }, actions: [{ type: 'email', config: { template: 'overdue_reminder' } }], enabled: false },
  { id: 'inv-auto-send', name: 'Auto-Send Invoices', description: 'Email invoices immediately when created', module: 'invoicing', trigger: { type: 'event', event: 'invoice.created' }, actions: [{ type: 'email', config: { template: 'invoice_delivery' } }], enabled: true },
  { id: 'inv-paid-notify', name: 'Payment Received Alert', description: 'Notify when invoice is paid', module: 'invoicing', trigger: { type: 'event', event: 'invoice.paid' }, actions: [{ type: 'notification', config: { message: 'Payment received!', type: 'success' } }], enabled: true },
  { id: 'crm-welcome', name: 'New Contact Welcome', description: 'Send welcome email to new contacts', module: 'crm', trigger: { type: 'event', event: 'contact.created' }, actions: [{ type: 'email', config: { template: 'contact_welcome' } }], enabled: false },
  { id: 'crm-deal-won', name: 'Deal Won Notification', description: 'Notify team when deal is won', module: 'crm', trigger: { type: 'event', event: 'deal.won' }, actions: [{ type: 'notification', config: { message: 'Deal won!', type: 'success' } }], enabled: true },
  { id: 'crm-followup', name: 'Follow-up Reminder', description: 'Daily reminder for pending follow-ups', module: 'crm', trigger: { type: 'schedule', schedule: 'Daily at 8 AM' }, actions: [{ type: 'notification', config: { message: 'Pending follow-ups', type: 'warning' } }], enabled: false },
  { id: 'crm-stale-deal', name: 'Stale Deal Alert', description: 'Alert when deal has no activity for 14 days', module: 'crm', trigger: { type: 'condition', condition: { daysNoActivity: 14 } }, actions: [{ type: 'notification', config: { message: 'Deal needs attention', type: 'warning' } }], enabled: false },
  { id: 'hr-attendance', name: 'Daily Attendance Report', description: 'Send daily attendance summary', module: 'hr', trigger: { type: 'schedule', schedule: 'Daily at 6 PM' }, actions: [{ type: 'report', config: { reportType: 'attendance' } }], enabled: false },
  { id: 'hr-leave-approve', name: 'Leave Request Alert', description: 'Notify manager of new leave requests', module: 'hr', trigger: { type: 'event', event: 'leave.requested' }, actions: [{ type: 'notification', config: { message: 'New leave request', type: 'info' } }], enabled: true },
  { id: 'hr-payroll', name: 'Monthly Payroll Run', description: 'Auto-generate payroll on 25th of month', module: 'hr', trigger: { type: 'schedule', schedule: '25th of every month' }, actions: [{ type: 'create_record', config: { model: 'PayrollRun' } }], enabled: false },
  { id: 'hr-birthday', name: 'Employee Birthday Wish', description: 'Send birthday wishes to employees', module: 'hr', trigger: { type: 'schedule', schedule: 'Daily check' }, actions: [{ type: 'email', config: { template: 'birthday_wish' } }], enabled: true },
  { id: 'inv-low-stock', name: 'Low Stock Alert', description: 'Alert when items fall below reorder level', module: 'inventory', trigger: { type: 'condition', condition: { field: 'quantity', operator: 'lte', refField: 'reorderLevel' } }, actions: [{ type: 'notification', config: { message: 'Low stock!', type: 'warning' } }], enabled: true },
  { id: 'inv-reorder', name: 'Auto Create Purchase Order', description: 'Create PO when stock is critically low', module: 'inventory', trigger: { type: 'condition', condition: { field: 'quantity', operator: 'lte', value: 0 } }, actions: [{ type: 'create_record', config: { model: 'PurchaseOrder' } }], enabled: false },
  { id: 'inv-stock-report', name: 'Weekly Stock Report', description: 'Generate weekly inventory report', module: 'inventory', trigger: { type: 'schedule', schedule: 'Every Monday' }, actions: [{ type: 'report', config: { reportType: 'inventory' } }], enabled: false },
  { id: 'mkt-campaign-report', name: 'Campaign Performance Report', description: 'Weekly email campaign analytics', module: 'marketing', trigger: { type: 'schedule', schedule: 'Every Monday' }, actions: [{ type: 'report', config: { reportType: 'campaign' } }], enabled: false },
  { id: 'mkt-blog-publish', name: 'Blog Publish Notification', description: 'Notify subscribers of new blog posts', module: 'marketing', trigger: { type: 'event', event: 'blog.published' }, actions: [{ type: 'email', config: { template: 'blog_publish' } }], enabled: true },
  { id: 'mkt-ai-content', name: 'AI Content Generation', description: 'Auto-generate social media content weekly', module: 'marketing', trigger: { type: 'schedule', schedule: 'Weekly' }, actions: [{ type: 'ai_generate', config: { mediaType: 'image', style: 'minimal' } }], enabled: false },
  { id: 'comp-due-remind', name: 'Compliance Deadline Reminder', description: 'Remind 7 days before due date', module: 'compliance', trigger: { type: 'schedule', schedule: 'Daily' }, actions: [{ type: 'notification', config: { message: 'Deadline approaching', type: 'warning' } }], enabled: true },
  { id: 'comp-overdue', name: 'Overdue Compliance Alert', description: 'Alert for overdue compliance tasks', module: 'compliance', trigger: { type: 'condition', condition: { field: 'dueDate', operator: 'lt', value: 'today' } }, actions: [{ type: 'notification', config: { message: 'Overdue task!', type: 'error' } }], enabled: true },
  { id: 'comp-monthly-report', name: 'Monthly Compliance Report', description: 'Generate monthly compliance summary', module: 'compliance', trigger: { type: 'schedule', schedule: 'Monthly' }, actions: [{ type: 'report', config: { reportType: 'compliance' } }], enabled: false },
  { id: 'sup-auto-assign', name: 'Auto-Assign Tickets', description: 'Assign new tickets to available agents', module: 'support', trigger: { type: 'event', event: 'ticket.created' }, actions: [{ type: 'update_status', config: { model: 'Ticket', updates: { status: 'in_progress' } } }], enabled: true },
  { id: 'sup-escalate', name: 'Escalate Urgent Tickets', description: 'Escalate unresolved urgent tickets after 4 hours', module: 'support', trigger: { type: 'condition', condition: { priority: 'urgent', unresolvedHours: 4 } }, actions: [{ type: 'notification', config: { message: 'Urgent ticket escalated', type: 'error' } }], enabled: true },
  { id: 'sup-satisfaction', name: 'Customer Satisfaction Survey', description: 'Send survey after ticket resolution', module: 'support', trigger: { type: 'event', event: 'ticket.resolved' }, actions: [{ type: 'email', config: { template: 'satisfaction_survey' } }], enabled: false },
  { id: 'ai-weekly-content', name: 'Weekly AI Content Batch', description: 'Generate marketing visuals every Monday', module: 'ai', trigger: { type: 'schedule', schedule: 'Every Monday' }, actions: [{ type: 'ai_generate', config: { mediaType: 'image', style: 'photorealistic' } }], enabled: false },
  { id: 'ai-daily-insights', name: 'Daily AI Business Insights', description: 'AI-generated daily business summary', module: 'ai', trigger: { type: 'schedule', schedule: 'Daily at 7 AM' }, actions: [{ type: 'report', config: { reportType: 'ai_insights' } }], enabled: false },
  { id: 'rep-daily-summary', name: 'Daily Business Summary', description: 'Email daily key metrics summary', module: 'reports', trigger: { type: 'schedule', schedule: 'Daily at 8 AM' }, actions: [{ type: 'report', config: { reportType: 'daily_summary' } }, { type: 'email', config: { template: 'daily_summary' } }], enabled: true },
  { id: 'rep-monthly-full', name: 'Monthly Full Report', description: 'Comprehensive monthly business report', module: 'reports', trigger: { type: 'schedule', schedule: '1st of every month' }, actions: [{ type: 'report', config: { reportType: 'monthly_full' } }, { type: 'email', config: { template: 'monthly_report' } }], enabled: true },
];

const MODULES = ['all', 'invoicing', 'crm', 'hr', 'inventory', 'marketing', 'compliance', 'support', 'ai', 'reports'];

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>(TEMPLATES);
  const [filter, setFilter] = useState('all');
  const [saved, setSaved] = useState(false);

  const toggleAutomation = (id: string) => {
    setAutomations(prev => prev.map(a => (a.id === id ? { ...a, enabled: !a.enabled } : a)));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const filtered = filter === 'all' ? automations : automations.filter(a => a.module === filter);
  const enabledCount = automations.filter(a => a.enabled).length;
  const moduleCounts = MODULES.filter(m => m !== 'all').map(m => ({ module: m, count: automations.filter(a => a.module === m && a.enabled).length }));

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Business Automations</h1>
                <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Automate workflows across all modules</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {saved && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
                  style={{ background: 'hsl(var(--primary) / 0.1)', border: '1px solid hsl(var(--primary) / 0.2)', color: '#34d399' }}>
                  <CheckCircle2 className="w-4 h-4" /> Saved
                </motion.div>
              )}
              <div className="glass-card px-4 py-2 rounded-xl text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                {enabledCount} of {automations.length} active
              </div>
            </div>
          </div>
        </motion.div>

        {/* Module Filter */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {MODULES.map(m => {
            const Icon = m !== 'all' ? MODULE_ICONS[m] : Activity;
            const isActive = filter === m;
            const colors = m !== 'all' ? MODULE_COLORS[m] : { bg: 'bg-[hsl(var(--primary))]/10', text: 'text-[hsl(var(--primary))]', border: 'border-[hsl(var(--primary))]/30' };
            return (
              <button key={m} onClick={() => setFilter(m)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${isActive ? `${colors.bg} ${colors.text} ${colors.border}` : 'glass-card hover:opacity-80'}`}
                style={!isActive ? { color: 'hsl(var(--muted-foreground))' } : {}}>
                <Icon className="w-4 h-4" />
                <span className="capitalize">{m}</span>
                {m !== 'all' && <span className="text-xs opacity-60">{moduleCounts.find(mc => mc.module === m)?.count || 0}</span>}
              </button>
            );
          })}
        </motion.div>

        {/* Stats Bar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Active', value: enabledCount, color: '#34d399' },
            { label: 'Total Rules', value: automations.length, color: 'hsl(var(--primary))' },
            { label: 'Modules', value: new Set(automations.map(a => a.module)).size, color: '#a78bfa' },
            { label: 'Event Triggers', value: automations.filter(a => a.trigger.type === 'event').length, color: '#94a3b8' },
          ].map((stat, i) => (
            <div key={i} className="glass-card p-4 rounded-xl">
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{stat.label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Automations List */}
        <div className="space-y-3">
          {filtered.map((automation, index) => {
            const Icon = MODULE_ICONS[automation.module] || Zap;
            const colors = MODULE_COLORS[automation.module] || MODULE_COLORS.invoicing;
            const TriggerIcon = automation.trigger.type === 'schedule' ? Clock : automation.trigger.type === 'event' ? Zap : Activity;

            return (
              <motion.div key={automation.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}
                className="glass-card p-4 sm:p-5 rounded-2xl transition-all"
                style={{ borderColor: automation.enabled ? 'hsl(var(--primary) / 0.3)' : 'hsl(var(--border))' }}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-6 h-6 ${colors.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{automation.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${colors.bg} ${colors.text}`}>{automation.module}</span>
                        </div>
                        <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{automation.description}</p>
                      </div>
                      <button onClick={() => toggleAutomation(automation.id!)}
                        className="relative w-14 h-7 rounded-full transition-colors shrink-0"
                        style={{ background: automation.enabled ? 'hsl(var(--primary))' : 'hsl(var(--muted))' }}>
                        <span className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all"
                          style={{ left: automation.enabled ? 'calc(100% - 1.5rem)' : '0.25rem' }} />
                      </button>
                    </div>
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <TriggerIcon className="w-3.5 h-3.5" />
                        <span className="capitalize">{automation.trigger.type}</span>
                        <span style={{ color: '#94a3b8' }}>—</span>
                        <span>{automation.trigger.schedule || automation.trigger.event || 'Condition-based'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <Mail className="w-3.5 h-3.5" />
                        <span>{automation.actions.length} action{automation.actions.length > 1 ? 's' : ''}</span>
                      </div>
                      {automation.runCount !== undefined && automation.runCount > 0 && (
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: '#34d399' }}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{automation.successCount || 0} successful</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Zap className="w-12 h-12 mx-auto mb-3" style={{ color: 'hsl(var(--primary) / 0.2)' }} />
            <p className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>No automations for this module</p>
          </div>
        )}
      </div>
    </div>
  );
}
