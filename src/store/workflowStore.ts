import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Workflow, WorkflowNode, WorkflowEdge, NodeType, WorkflowExecution } from '@/types/workflow';

interface WorkflowState {
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  nodeTypes: NodeType[];
  executions: WorkflowExecution[];
  selectedNode: string | null;
  
  // Actions
  setWorkflows: (workflows: Workflow[]) => void;
  addWorkflow: (workflow: Workflow) => void;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  setCurrentWorkflow: (workflow: Workflow | null) => void;
  addNode: (workflowId: string, node: WorkflowNode) => void;
  updateNode: (workflowId: string, nodeId: string, updates: Partial<WorkflowNode>) => void;
  removeNode: (workflowId: string, nodeId: string) => void;
  addEdge: (workflowId: string, edge: WorkflowEdge) => void;
  removeEdge: (workflowId: string, edgeId: string) => void;
  setSelectedNode: (nodeId: string | null) => void;
  addExecution: (execution: WorkflowExecution) => void;
  updateExecution: (id: string, updates: Partial<WorkflowExecution>) => void;
  clearDuplicateWorkflows: () => void;
}

const defaultNodeTypes: NodeType[] = [
  // Triggers
  {
    type: 'manual-trigger',
    category: 'Triggers',
    label: 'Manual Trigger',
    description: 'Start workflow manually',
    icon: 'Play',
    color: '#10b981',
    outputs: [{ name: 'trigger', type: 'object' }],
  },
  {
    type: 'schedule-trigger',
    category: 'Triggers',
    label: 'Schedule',
    description: 'Trigger on a schedule',
    icon: 'Clock',
    color: '#10b981',
    outputs: [{ name: 'trigger', type: 'object' }],
    defaultConfig: { cron: '0 9 * * *' },
  },
  {
    type: 'webhook-trigger',
    category: 'Triggers',
    label: 'Webhook',
    description: 'Trigger via HTTP webhook',
    icon: 'Webhook',
    color: '#10b981',
    outputs: [{ name: 'payload', type: 'object' }],
  },
  {
    type: 'email-trigger',
    category: 'Triggers',
    label: 'Email Trigger',
    description: 'Trigger when email received',
    icon: 'Mail',
    color: '#10b981',
    outputs: [{ name: 'email', type: 'object' }],
  },
  // Invoice & Billing
  {
    type: 'create-invoice',
    category: 'Billing',
    label: 'Create Invoice',
    description: 'Generate a new invoice',
    icon: 'FileText',
    color: '#6366f1',
    inputs: [
      { name: 'customer', type: 'object', required: true },
      { name: 'items', type: 'array', required: true },
    ],
    outputs: [{ name: 'invoice', type: 'object' }],
  },
  {
    type: 'send-invoice',
    category: 'Billing',
    label: 'Send Invoice',
    description: 'Email invoice to customer',
    icon: 'Send',
    color: '#6366f1',
    inputs: [
      { name: 'invoice', type: 'object', required: true },
      { name: 'template', type: 'string' },
    ],
    outputs: [{ name: 'sent', type: 'boolean' }],
  },
  {
    type: 'payment-reminder',
    category: 'Billing',
    label: 'Payment Reminder',
    description: 'Send payment reminder',
    icon: 'Bell',
    color: '#f59e0b',
    inputs: [
      { name: 'invoice', type: 'object', required: true },
      { name: 'daysOverdue', type: 'number' },
    ],
    outputs: [{ name: 'reminderSent', type: 'boolean' }],
  },
  {
    type: 'check-payment',
    category: 'Billing',
    label: 'Check Payment',
    description: 'Verify if invoice is paid',
    icon: 'CreditCard',
    color: '#6366f1',
    inputs: [{ name: 'invoiceId', type: 'string', required: true }],
    outputs: [
      { name: 'isPaid', type: 'boolean' },
      { name: 'paymentDate', type: 'string' },
    ],
  },
  {
    type: 'generate-report',
    category: 'Billing',
    label: 'Generate Report',
    description: 'Create financial report',
    icon: 'BarChart3',
    color: '#8b5cf6',
    inputs: [
      { name: 'startDate', type: 'string' },
      { name: 'endDate', type: 'string' },
      { name: 'type', type: 'string' },
    ],
    outputs: [{ name: 'report', type: 'object' }],
  },
  // Data
  {
    type: 'get-customer',
    category: 'Data',
    label: 'Get Customer',
    description: 'Fetch customer by ID or email',
    icon: 'User',
    color: '#3b82f6',
    inputs: [{ name: 'identifier', type: 'string', required: true }],
    outputs: [{ name: 'customer', type: 'object' }],
  },
  {
    type: 'create-customer',
    category: 'Data',
    label: 'Create Customer',
    description: 'Add new customer',
    icon: 'UserPlus',
    color: '#3b82f6',
    inputs: [
      { name: 'name', type: 'string', required: true },
      { name: 'email', type: 'string', required: true },
    ],
    outputs: [{ name: 'customer', type: 'object' }],
  },
  // Logic
  {
    type: 'condition',
    category: 'Logic',
    label: 'Condition',
    description: 'If/Else branching',
    icon: 'GitBranch',
    color: '#f59e0b',
    inputs: [{ name: 'condition', type: 'boolean', required: true }],
    outputs: [
      { name: 'true', type: 'object' },
      { name: 'false', type: 'object' },
    ],
  },
  {
    type: 'delay',
    category: 'Logic',
    label: 'Delay',
    description: 'Wait for specified time',
    icon: 'Timer',
    color: '#f59e0b',
    inputs: [{ name: 'duration', type: 'number', required: true }],
    outputs: [{ name: 'continue', type: 'object' }],
    defaultConfig: { duration: 60, unit: 'minutes' },
  },
  // Integrations
  {
    type: 'send-email',
    category: 'Integrations',
    label: 'Send Email',
    description: 'Send email via SMTP',
    icon: 'Mail',
    color: '#ec4899',
    inputs: [
      { name: 'to', type: 'string', required: true },
      { name: 'subject', type: 'string', required: true },
      { name: 'body', type: 'string', required: true },
    ],
    outputs: [{ name: 'sent', type: 'boolean' }],
  },
  {
    type: 'http-request',
    category: 'Integrations',
    label: 'HTTP Request',
    description: 'Make API call',
    icon: 'Globe',
    color: '#ec4899',
    inputs: [
      { name: 'url', type: 'string', required: true },
      { name: 'method', type: 'string' },
      { name: 'body', type: 'object' },
    ],
    outputs: [
      { name: 'response', type: 'object' },
      { name: 'status', type: 'number' },
    ],
  },
  {
    type: 'google-sheets',
    category: 'Integrations',
    label: 'Google Sheets',
    description: 'Read/Write to Sheets',
    icon: 'Table',
    color: '#ec4899',
    inputs: [
      { name: 'spreadsheetId', type: 'string', required: true },
      { name: 'range', type: 'string', required: true },
      { name: 'values', type: 'array' },
    ],
    outputs: [{ name: 'data', type: 'array' }],
  },
];

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set, get) => ({
      workflows: [],
      currentWorkflow: null,
      nodeTypes: defaultNodeTypes,
      executions: [],
      selectedNode: null,

      setWorkflows: (workflows) => set({ workflows }),
      
      addWorkflow: (workflow) => 
        set((state) => {
          // Check if workflow with same ID already exists
          const exists = state.workflows.some(w => w.id === workflow.id);
          if (exists) {
            // Generate a new unique ID
            const existingIds = state.workflows.map(w => {
              const match = w.id.match(/wf-(\d+)/);
              return match ? parseInt(match[1], 10) : 0;
            });
            const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
            workflow.id = `wf-${maxId + 1}`;
          }
          return { workflows: [...state.workflows, workflow] };
        }),
      
      updateWorkflow: (id, updates) =>
        set((state) => ({
          workflows: state.workflows.map((w) =>
            w.id === id ? { ...w, ...updates, updatedAt: new Date().toISOString() } : w
          ),
          currentWorkflow: state.currentWorkflow?.id === id 
            ? { ...state.currentWorkflow, ...updates, updatedAt: new Date().toISOString() }
            : state.currentWorkflow,
        })),
      
      deleteWorkflow: (id) =>
        set((state) => ({
          workflows: state.workflows.filter((w) => w.id !== id),
          currentWorkflow: state.currentWorkflow?.id === id ? null : state.currentWorkflow,
        })),
      
      setCurrentWorkflow: (workflow) => set({ currentWorkflow: workflow }),
      
      addNode: (workflowId, node) =>
        set((state) => {
          const workflow = state.workflows.find((w) => w.id === workflowId);
          if (!workflow) return state;
          const updatedWorkflow = {
            ...workflow,
            nodes: [...workflow.nodes, node],
            updatedAt: new Date().toISOString(),
          };
          return {
            workflows: state.workflows.map((w) => (w.id === workflowId ? updatedWorkflow : w)),
            currentWorkflow: state.currentWorkflow?.id === workflowId ? updatedWorkflow : state.currentWorkflow,
          };
        }),
      
      updateNode: (workflowId, nodeId, updates) =>
        set((state) => {
          const workflow = state.workflows.find((w) => w.id === workflowId);
          if (!workflow) return state;
          const updatedWorkflow = {
            ...workflow,
            nodes: workflow.nodes.map((n) => (n.id === nodeId ? { ...n, ...updates } : n)),
            updatedAt: new Date().toISOString(),
          };
          return {
            workflows: state.workflows.map((w) => (w.id === workflowId ? updatedWorkflow : w)),
            currentWorkflow: state.currentWorkflow?.id === workflowId ? updatedWorkflow : state.currentWorkflow,
          };
        }),
      
      removeNode: (workflowId, nodeId) =>
        set((state) => {
          const workflow = state.workflows.find((w) => w.id === workflowId);
          if (!workflow) return state;
          const updatedWorkflow = {
            ...workflow,
            nodes: workflow.nodes.filter((n) => n.id !== nodeId),
            edges: workflow.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
            updatedAt: new Date().toISOString(),
          };
          return {
            workflows: state.workflows.map((w) => (w.id === workflowId ? updatedWorkflow : w)),
            currentWorkflow: state.currentWorkflow?.id === workflowId ? updatedWorkflow : state.currentWorkflow,
          };
        }),
      
      addEdge: (workflowId, edge) =>
        set((state) => {
          const workflow = state.workflows.find((w) => w.id === workflowId);
          if (!workflow) return state;
          const updatedWorkflow = {
            ...workflow,
            edges: [...workflow.edges, edge],
            updatedAt: new Date().toISOString(),
          };
          return {
            workflows: state.workflows.map((w) => (w.id === workflowId ? updatedWorkflow : w)),
            currentWorkflow: state.currentWorkflow?.id === workflowId ? updatedWorkflow : state.currentWorkflow,
          };
        }),
      
      removeEdge: (workflowId, edgeId) =>
        set((state) => {
          const workflow = state.workflows.find((w) => w.id === workflowId);
          if (!workflow) return state;
          const updatedWorkflow = {
            ...workflow,
            edges: workflow.edges.filter((e) => e.id !== edgeId),
            updatedAt: new Date().toISOString(),
          };
          return {
            workflows: state.workflows.map((w) => (w.id === workflowId ? updatedWorkflow : w)),
            currentWorkflow: state.currentWorkflow?.id === workflowId ? updatedWorkflow : state.currentWorkflow,
          };
        }),
      
      setSelectedNode: (nodeId) => set({ selectedNode: nodeId }),
      
      addExecution: (execution) =>
        set((state) => ({ executions: [...state.executions, execution] })),
      
      updateExecution: (id, updates) =>
        set((state) => ({
          executions: state.executions.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),
      
      clearDuplicateWorkflows: () =>
        set((state) => {
          const seen = new Set();
          const uniqueWorkflows = state.workflows.filter((w) => {
            if (seen.has(w.id)) return false;
            seen.add(w.id);
            return true;
          });
          return { workflows: uniqueWorkflows };
        }),
    }),
    {
      name: 'workflow-storage',
    }
  )
);
