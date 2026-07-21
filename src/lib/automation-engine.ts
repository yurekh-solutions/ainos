// AINOS Automation Engine - Handles all business automations
import connectDB from './mongodb';
import Automation from '@/models/Automation';
import { getRedis, cacheSet } from './redis';

export interface AutomationContext {
  userId: string;
  data?: Record<string, unknown>;
  timestamp: Date;
}

// Action handlers for each automation type
const actionHandlers = {
  email: async (config: Record<string, unknown>, ctx: AutomationContext) => {
    // Queue email job
    const { enqueueJob } = await import('./queue');
    await enqueueJob('send_email', {
      to: config.to,
      subject: config.subject,
      body: config.body,
      template: config.template,
    });
    return { success: true, action: 'email_queued' };
  },

  notification: async (config: Record<string, unknown>, ctx: AutomationContext) => {
    // Store notification in cache for real-time display
    const redis = getRedis();
    if (redis) {
      await redis.lpush(`notifications:${ctx.userId}`, JSON.stringify({
        id: Date.now().toString(),
        message: config.message,
        type: config.type || 'info',
        createdAt: new Date().toISOString(),
        read: false,
      }));
      await redis.ltrim(`notifications:${ctx.userId}`, 0, 99); // Keep last 100
    }
    return { success: true, action: 'notification_sent' };
  },

  webhook: async (config: Record<string, unknown>, _ctx: AutomationContext) => {
    if (config.url) {
      await fetch(config.url as string, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(config.headers as Record<string, string>) || {} },
        body: JSON.stringify(config.payload || {}),
      });
    }
    return { success: true, action: 'webhook_fired' };
  },

  update_status: async (config: Record<string, unknown>, ctx: AutomationContext) => {
    // Update record status in the relevant collection
    await connectDB();
    const mongoose = (await import('mongoose')).default;
    const Model = mongoose.models[config.model as string];
    if (Model) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (Model as any).updateMany(
        { createdBy: ctx.userId, ...((config.filter || {}) as Record<string, unknown>) },
        { $set: config.updates }
      );
    }
    return { success: true, action: 'status_updated' };
  },

  create_record: async (config: Record<string, unknown>, ctx: AutomationContext) => {
    await connectDB();
    const mongoose = (await import('mongoose')).default;
    const Model = mongoose.models[config.model as string];
    if (Model) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (Model as any).create({ ...((config.data || {}) as Record<string, unknown>), createdBy: ctx.userId });
    }
    return { success: true, action: 'record_created' };
  },

  ai_generate: async (config: Record<string, unknown>, _ctx: AutomationContext) => {
    // Queue AI generation job
    const { enqueueJob } = await import('./queue');
    await enqueueJob('ai_media_generate', {
      prompt: config.prompt,
      mediaType: config.mediaType || 'image',
      style: config.style || 'photorealistic',
    });
    return { success: true, action: 'ai_generation_queued' };
  },

  report: async (config: Record<string, unknown>, ctx: AutomationContext) => {
    // Generate and cache report
    const reportData = {
      type: config.reportType || 'summary',
      period: config.period || 'monthly',
      generatedAt: new Date().toISOString(),
      userId: ctx.userId,
    };
    await cacheSet(`report:auto:${ctx.userId}:${config.reportType}`, reportData, 3600);
    return { success: true, action: 'report_generated' };
  },
};

// Run a single automation
export async function runAutomation(automationId: string, context: AutomationContext): Promise<{ success: boolean; results: unknown[] }> {
  await connectDB();
  const automation = await Automation.findById(automationId);
  if (!automation || !automation.enabled) {
    return { success: false, results: [] };
  }

  const results: unknown[] = [];
  let allSuccess = true;

  for (const action of automation.actions) {
    try {
      const handler = actionHandlers[action.type as keyof typeof actionHandlers];
      if (handler) {
        const result = await handler(action.config, context);
        results.push(result);
      }
    } catch (error) {
      allSuccess = false;
      results.push({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  // Update automation stats
  automation.lastRun = new Date();
  automation.runCount += 1;
  if (allSuccess) automation.successCount += 1;
  else automation.errorCount += 1;
  await automation.save();

  return { success: allSuccess, results };
}

// Run all automations for a specific event
export async function triggerEvent(event: string, userId: string, data?: Record<string, unknown>): Promise<void> {
  await connectDB();
  const automations = await Automation.find({
    createdBy: userId,
    enabled: true,
    'trigger.type': 'event',
    'trigger.event': event,
  });

  const ctx: AutomationContext = { userId, data, timestamp: new Date() };

  for (const automation of automations) {
    await runAutomation(automation._id.toString(), ctx);
  }
}

// Run all scheduled automations due now
export async function runScheduledAutomations(): Promise<number> {
  await connectDB();
  const now = new Date();

  const automations = await Automation.find({
    enabled: true,
    'trigger.type': 'schedule',
    $or: [
      { nextRun: { $lte: now } },
      { nextRun: { $exists: false } },
    ],
  });

  let count = 0;
  for (const automation of automations) {
    const ctx: AutomationContext = {
      userId: automation.createdBy,
      timestamp: new Date(),
    };
    await runAutomation(automation._id.toString(), ctx);
    count++;
  }

  return count;
}

// Default automation templates for each module
export const AUTOMATION_TEMPLATES = [
  // Invoicing
  { id: 'inv-remind', name: 'Overdue Invoice Reminders', module: 'invoicing' as const, description: 'Send reminders for overdue invoices', trigger: { type: 'schedule' as const, schedule: 'daily' }, actions: [{ type: 'email' as const, config: { template: 'overdue_reminder' } }] },
  { id: 'inv-auto-send', name: 'Auto-Send Invoices', module: 'invoicing' as const, description: 'Email invoices immediately when created', trigger: { type: 'event' as const, event: 'invoice.created' }, actions: [{ type: 'email' as const, config: { template: 'invoice_delivery' } }] },
  { id: 'inv-paid-notify', name: 'Payment Received Alert', module: 'invoicing' as const, description: 'Notify when invoice is paid', trigger: { type: 'event' as const, event: 'invoice.paid' }, actions: [{ type: 'notification' as const, config: { message: 'Payment received!', type: 'success' } }] },

  // CRM
  { id: 'crm-welcome', name: 'New Contact Welcome', module: 'crm' as const, description: 'Send welcome email to new contacts', trigger: { type: 'event' as const, event: 'contact.created' }, actions: [{ type: 'email' as const, config: { template: 'contact_welcome' } }] },
  { id: 'crm-deal-won', name: 'Deal Won Celebration', module: 'crm' as const, description: 'Notify team when deal is won', trigger: { type: 'event' as const, event: 'deal.won' }, actions: [{ type: 'notification' as const, config: { message: 'Deal won!', type: 'success' } }, { type: 'email' as const, config: { template: 'deal_won' } }] },
  { id: 'crm-followup', name: 'Follow-up Reminder', module: 'crm' as const, description: 'Remind about pending follow-ups', trigger: { type: 'schedule' as const, schedule: 'daily' }, actions: [{ type: 'notification' as const, config: { message: 'You have pending follow-ups', type: 'warning' } }] },
  { id: 'crm-stale-deal', name: 'Stale Deal Alert', module: 'crm' as const, description: 'Alert when deal has no activity for 14 days', trigger: { type: 'condition' as const, condition: { daysNoActivity: 14 } }, actions: [{ type: 'notification' as const, config: { message: 'Deal needs attention', type: 'warning' } }] },

  // HR
  { id: 'hr-attendance', name: 'Daily Attendance Report', module: 'hr' as const, description: 'Send daily attendance summary', trigger: { type: 'schedule' as const, schedule: 'daily' }, actions: [{ type: 'report' as const, config: { reportType: 'attendance', period: 'daily' } }] },
  { id: 'hr-leave-approve', name: 'Leave Request Alert', module: 'hr' as const, description: 'Notify manager of new leave requests', trigger: { type: 'event' as const, event: 'leave.requested' }, actions: [{ type: 'notification' as const, config: { message: 'New leave request pending', type: 'info' } }] },
  { id: 'hr-payroll', name: 'Monthly Payroll Run', module: 'hr' as const, description: 'Auto-generate payroll on 25th of month', trigger: { type: 'schedule' as const, schedule: 'monthly' }, actions: [{ type: 'create_record' as const, config: { model: 'PayrollRun' } }, { type: 'email' as const, config: { template: 'payroll_ready' } }] },
  { id: 'hr-birthday', name: 'Employee Birthday Wish', module: 'hr' as const, description: 'Send birthday wishes to employees', trigger: { type: 'schedule' as const, schedule: 'daily' }, actions: [{ type: 'email' as const, config: { template: 'birthday_wish' } }] },

  // Inventory
  { id: 'inv-low-stock', name: 'Low Stock Alert', module: 'inventory' as const, description: 'Alert when items fall below reorder level', trigger: { type: 'condition' as const, condition: { field: 'quantity', operator: 'lte', refField: 'reorderLevel' } }, actions: [{ type: 'notification' as const, config: { message: 'Low stock alert!', type: 'warning' } }, { type: 'email' as const, config: { template: 'low_stock' } }] },
  { id: 'inv-reorder', name: 'Auto Create Purchase Order', module: 'inventory' as const, description: 'Create PO when stock is critically low', trigger: { type: 'condition' as const, condition: { field: 'quantity', operator: 'lte', value: 0 } }, actions: [{ type: 'create_record' as const, config: { model: 'PurchaseOrder' } }] },
  { id: 'inv-stock-report', name: 'Weekly Stock Report', module: 'inventory' as const, description: 'Generate weekly inventory report', trigger: { type: 'schedule' as const, schedule: 'weekly' }, actions: [{ type: 'report' as const, config: { reportType: 'inventory', period: 'weekly' } }] },

  // Marketing
  { id: 'mkt-campaign-report', name: 'Campaign Performance Report', module: 'marketing' as const, description: 'Weekly email campaign analytics', trigger: { type: 'schedule' as const, schedule: 'weekly' }, actions: [{ type: 'report' as const, config: { reportType: 'campaign', period: 'weekly' } }, { type: 'email' as const, config: { template: 'campaign_report' } }] },
  { id: 'mkt-blog-publish', name: 'Blog Publish Notification', module: 'marketing' as const, description: 'Notify subscribers of new blog posts', trigger: { type: 'event' as const, event: 'blog.published' }, actions: [{ type: 'email' as const, config: { template: 'blog_publish' } }] },
  { id: 'mkt-ai-content', name: 'AI Content Generation', module: 'marketing' as const, description: 'Auto-generate social media content weekly', trigger: { type: 'schedule' as const, schedule: 'weekly' }, actions: [{ type: 'ai_generate' as const, config: { mediaType: 'image', style: 'minimal' } }] },

  // Compliance
  { id: 'comp-due-remind', name: 'Compliance Deadline Reminder', module: 'compliance' as const, description: 'Remind 7 days before compliance due date', trigger: { type: 'schedule' as const, schedule: 'daily' }, actions: [{ type: 'notification' as const, config: { message: 'Compliance deadline approaching', type: 'warning' } }] },
  { id: 'comp-overdue', name: 'Overdue Compliance Alert', module: 'compliance' as const, description: 'Alert for overdue compliance tasks', trigger: { type: 'condition' as const, condition: { field: 'dueDate', operator: 'lt', value: 'today' } }, actions: [{ type: 'notification' as const, config: { message: 'Overdue compliance task!', type: 'error' } }, { type: 'email' as const, config: { template: 'compliance_overdue' } }] },
  { id: 'comp-monthly-report', name: 'Monthly Compliance Report', module: 'compliance' as const, description: 'Generate monthly compliance summary', trigger: { type: 'schedule' as const, schedule: 'monthly' }, actions: [{ type: 'report' as const, config: { reportType: 'compliance', period: 'monthly' } }] },

  // Support
  { id: 'sup-auto-assign', name: 'Auto-Assign Tickets', module: 'support' as const, description: 'Assign new tickets to available agents', trigger: { type: 'event' as const, event: 'ticket.created' }, actions: [{ type: 'update_status' as const, config: { model: 'Ticket', updates: { status: 'in_progress' } } }] },
  { id: 'sup-escalate', name: 'Escalate Urgent Tickets', module: 'support' as const, description: 'Escalate unresolved urgent tickets after 4 hours', trigger: { type: 'condition' as const, condition: { priority: 'urgent', unresolvedHours: 4 } }, actions: [{ type: 'notification' as const, config: { message: 'Urgent ticket escalated', type: 'error' } }] },
  { id: 'sup-satisfaction', name: 'Customer Satisfaction Survey', module: 'support' as const, description: 'Send survey after ticket resolution', trigger: { type: 'event' as const, event: 'ticket.resolved' }, actions: [{ type: 'email' as const, config: { template: 'satisfaction_survey' } }] },

  // AI
  { id: 'ai-weekly-content', name: 'Weekly AI Content Batch', module: 'ai' as const, description: 'Generate marketing visuals every Monday', trigger: { type: 'schedule' as const, schedule: 'weekly' }, actions: [{ type: 'ai_generate' as const, config: { mediaType: 'image', style: 'photorealistic' } }] },
  { id: 'ai-daily-insights', name: 'Daily AI Business Insights', module: 'ai' as const, description: 'AI-generated daily business summary', trigger: { type: 'schedule' as const, schedule: 'daily' }, actions: [{ type: 'report' as const, config: { reportType: 'ai_insights', period: 'daily' } }, { type: 'email' as const, config: { template: 'ai_insights' } }] },

  // Reports
  { id: 'rep-daily-summary', name: 'Daily Business Summary', module: 'reports' as const, description: 'Email daily key metrics summary', trigger: { type: 'schedule' as const, schedule: 'daily' }, actions: [{ type: 'report' as const, config: { reportType: 'daily_summary', period: 'daily' } }, { type: 'email' as const, config: { template: 'daily_summary' } }] },
  { id: 'rep-monthly-full', name: 'Monthly Full Report', module: 'reports' as const, description: 'Comprehensive monthly business report', trigger: { type: 'schedule' as const, schedule: 'monthly' }, actions: [{ type: 'report' as const, config: { reportType: 'monthly_full', period: 'monthly' } }, { type: 'email' as const, config: { template: 'monthly_report' } }] },
];
