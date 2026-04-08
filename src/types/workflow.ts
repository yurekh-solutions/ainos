export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: NodeData;
}

export interface NodeData {
  label: string;
  description?: string;
  icon?: string;
  color?: string;
  config?: Record<string, unknown>;
  inputs?: NodeInput[];
  outputs?: NodeOutput[];
}

export interface NodeInput {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
}

export interface NodeOutput {
  name: string;
  type: string;
  description?: string;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  triggerType?: 'manual' | 'scheduled' | 'webhook' | 'email';
  schedule?: string;
}

export interface NodeType {
  type: string;
  category: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  inputs?: NodeInput[];
  outputs?: NodeOutput[];
  defaultConfig?: Record<string, unknown>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  results?: Record<string, unknown>;
  error?: string;
  nodeExecutions?: NodeExecution[];
}

export interface NodeExecution {
  nodeId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  executionTime?: number;
}

// Billing & Invoice Specific Types
export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  createdAt: string;
  paidAt?: string;
  notes?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  company?: string;
  taxId?: string;
  createdAt: string;
}

export interface BillingAutomation {
  id: string;
  name: string;
  workflowId: string;
  trigger: 'schedule' | 'event' | 'manual';
  config: Record<string, unknown>;
  isActive: boolean;
}
