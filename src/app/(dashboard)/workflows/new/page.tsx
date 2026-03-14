'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Zap, Clock, Webhook, Mail } from 'lucide-react';
import Link from 'next/link';
import { useWorkflowStore } from '@/store/workflowStore';
import type { Workflow } from '@/types/workflow';

const templates = [
  {
    id: 'invoice-auto',
    name: 'Invoice Auto-Generation',
    description: 'Automatically generate and send invoices on a schedule',
    icon: Zap,
    color: 'from-blue-500 to-cyan-500',
    nodes: ['schedule-trigger', 'create-invoice', 'send-invoice'],
  },
  {
    id: 'payment-reminder',
    name: 'Payment Reminders',
    description: 'Send automated payment reminders for overdue invoices',
    icon: Clock,
    color: 'from-orange-500 to-red-500',
    nodes: ['schedule-trigger', 'check-payment', 'payment-reminder'],
  },
  {
    id: 'customer-onboard',
    name: 'Customer Onboarding',
    description: 'Welcome new customers and set up their billing',
    icon: Webhook,
    color: 'from-green-500 to-emerald-500',
    nodes: ['webhook-trigger', 'create-customer', 'send-email'],
  },
  {
    id: 'monthly-report',
    name: 'Monthly Reports',
    description: 'Generate and email monthly financial reports',
    icon: Mail,
    color: 'from-purple-500 to-pink-500',
    nodes: ['schedule-trigger', 'generate-report', 'send-email'],
  },
];

export default function NewWorkflowPage() {
  const router = useRouter();
  const { addWorkflow } = useWorkflowStore();
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const { workflows } = useWorkflowStore();

  const generateWorkflowId = () => {
    // Find the highest existing workflow number and increment
    const existingIds = workflows.map(w => {
      const match = w.id.match(/wf-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    return `wf-${maxId + 1}`;
  };

  const handleCreateWorkflow = () => {
    if (!workflowName.trim()) return;

    const newWorkflow: Workflow = {
      id: generateWorkflowId(),
      name: workflowName,
      description: workflowDescription,
      nodes: [],
      edges: [],
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'user-1',
      triggerType: 'manual',
    };

    addWorkflow(newWorkflow);
    router.push(`/workflows/${newWorkflow.id}`);
  };

  const handleUseTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    const newWorkflow: Workflow = {
      id: generateWorkflowId(),
      name: template.name,
      description: template.description,
      nodes: [],
      edges: [],
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'user-1',
      triggerType: template.id === 'customer-onboard' ? 'webhook' : 'scheduled',
    };

    addWorkflow(newWorkflow);
    router.push(`/workflows/${newWorkflow.id}`);
  };

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/workflows"
            className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Create Workflow</h1>
            <p className="text-white/60 mt-1">Choose a template or start from scratch</p>
          </div>
        </div>

        {/* Templates */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            Quick Start Templates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map((template, index) => {
              const Icon = template.icon;
              return (
                <motion.button
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleUseTemplate(template.id)}
                  className="glass-card p-6 text-left hover:border-white/30 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-indigo-400 transition-colors">
                        {template.name}
                      </h3>
                      <p className="text-white/50 text-sm">{template.description}</p>
                      <div className="mt-3 flex items-center gap-2">
                        {template.nodes.map((node, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-1 rounded bg-white/5 text-white/40"
                          >
                            {node}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Custom Workflow */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Start from Scratch</h2>
          <div className="space-y-6">
            <div>
              <label className="text-white/60 text-sm mb-2 block">Workflow Name</label>
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="Enter workflow name..."
                className="glass-input w-full px-4 py-3 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="text-white/60 text-sm mb-2 block">Description</label>
              <textarea
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                placeholder="Describe what this workflow does..."
                rows={3}
                className="glass-input w-full px-4 py-3 rounded-xl text-white resize-none"
              />
            </div>
            <button
              onClick={handleCreateWorkflow}
              disabled={!workflowName.trim()}
              className="glass-button w-full py-3 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Custom Workflow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
