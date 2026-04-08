'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Mail, 
  FileText, 
  UserPlus, 
  Package, 
  Settings, 
  Sparkles,
  Clock,
  CheckCircle2
} from 'lucide-react';

interface Automation {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  enabled: boolean;
  schedule?: string;
}

const defaultAutomations: Automation[] = [
  {
    id: 'payment-reminders',
    name: 'Payment Reminders',
    description: 'Automatically remind customers about overdue invoices',
    icon: Bell,
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    enabled: false,
    schedule: '3 days after due date',
  },
  {
    id: 'invoice-auto-send',
    name: 'Invoice Auto-Send',
    description: 'Automatically email invoices to customers when created',
    icon: Mail,
    iconColor: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
    enabled: true,
    schedule: 'Immediately',
  },
  {
    id: 'monthly-reports',
    name: 'Monthly Reports',
    description: 'Email monthly summary reports to your inbox',
    icon: FileText,
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    enabled: false,
    schedule: '1st of every month',
  },
  {
    id: 'customer-welcome',
    name: 'Customer Welcome',
    description: 'Send a welcome email to new customers',
    icon: UserPlus,
    iconColor: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
    enabled: true,
    schedule: 'Immediately',
  },
  {
    id: 'low-stock-alert',
    name: 'Low Stock Alert',
    description: 'Alert when product quantity falls below threshold',
    icon: Package,
    iconColor: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    enabled: false,
    schedule: 'When stock < 10',
  },
];

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>(defaultAutomations);
  const [saved, setSaved] = useState(false);

  const toggleAutomation = (id: string) => {
    setAutomations(prev =>
      prev.map(a => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const enabledCount = automations.filter(a => a.enabled).length;

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8" style={{ background: 'var(--page-gradient)' }}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
                Automations
              </h1>
            </div>
            <p className="text-sm sm:text-base" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Simplify your workflow with automated tasks
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
                style={{ 
                  background: 'hsl(142 76% 36% / 0.1)',
                  border: '1px solid hsl(142 76% 36% / 0.2)',
                  color: 'hsl(142 76% 36%)'
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                Saved
              </motion.div>
            )}
            <div className="glass-card-subtle px-4 py-2 rounded-xl text-sm font-medium"
              style={{ color: 'hsl(var(--foreground))' }}>
              {enabledCount} of {automations.length} active
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl"
          style={{ 
            background: 'hsl(var(--primary) / 0.08)',
            border: '1px solid hsl(var(--primary) / 0.2)'
          }}
        >
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 mt-0.5" style={{ color: 'hsl(var(--primary))' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                Smart Automations Made Simple
              </p>
              <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Toggle automations on or off to automate your billing tasks. No complex setup required.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Automations Grid */}
        <div className="grid gap-4">
          {automations.map((automation, index) => (
            <motion.div
              key={automation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card p-4 sm:p-5"
              style={{
                borderColor: automation.enabled ? 'hsl(var(--primary) / 0.3)' : undefined
              }}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl ${automation.bgColor} flex items-center justify-center shrink-0`}>
                  <automation.icon className={`w-6 h-6 ${automation.iconColor}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                        {automation.name}
                      </h3>
                      <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {automation.description}
                      </p>
                    </div>

                    {/* Toggle */}
                    <button
                      onClick={() => toggleAutomation(automation.id)}
                      className="relative w-14 h-7 rounded-full transition-colors shrink-0"
                      style={{
                        background: automation.enabled ? 'hsl(var(--primary))' : 'hsl(var(--muted))'
                      }}
                    >
                      <span
                        className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all"
                        style={{
                          left: automation.enabled ? 'calc(100% - 1.5rem)' : '0.25rem'
                        }}
                      />
                    </button>
                  </div>

                  {/* Schedule Info */}
                  {automation.schedule && (
                    <div className="flex items-center gap-2 mt-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{automation.schedule}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Settings Button (when enabled) */}
              {automation.enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 pt-4 border-t"
                  style={{ borderColor: 'hsl(var(--border) / 0.5)' }}
                >
                  <button
                    className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
                    style={{ color: 'hsl(var(--primary))' }}
                  >
                    <Settings className="w-4 h-4" />
                    Configure Settings
                  </button>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="text-center py-4">
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            More automations coming soon!
          </p>
        </div>
      </div>
    </div>
  );
}
