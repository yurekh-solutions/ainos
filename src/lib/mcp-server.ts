// AINOS MCP Server Configuration
// Model Context Protocol - allows AI agents to interact with AINOS tools/APIs

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

export interface MCPServerConfig {
  name: string;
  version: string;
  tools: MCPTool[];
  resources: MCPResource[];
}

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

// AINOS MCP Tools - AI can call these to interact with the business suite
export const ainosTools: MCPTool[] = [
  {
    name: 'create_invoice',
    description: 'Create a new invoice for a customer',
    inputSchema: {
      type: 'object',
      properties: {
        customerId: { type: 'string', description: 'Customer ID' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              quantity: { type: 'number' },
              rate: { type: 'number' },
            },
          },
        },
        dueDate: { type: 'string', description: 'ISO date string' },
      },
      required: ['customerId', 'items'],
    },
    handler: async (args) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
      });
      return res.json();
    },
  },
  {
    name: 'get_customer',
    description: 'Get customer details by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Customer ID' },
      },
      required: ['id'],
    },
    handler: async (args) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/customers/${args.id}`);
      return res.json();
    },
  },
  {
    name: 'search_contacts',
    description: 'Search CRM contacts by name or email',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
      },
      required: ['query'],
    },
    handler: async (args) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/crm/contacts?q=${args.query}`);
      return res.json();
    },
  },
  {
    name: 'get_deals_pipeline',
    description: 'Get all deals in the CRM pipeline',
    inputSchema: {
      type: 'object',
      properties: {
        stage: { type: 'string', description: 'Filter by stage (optional)' },
      },
    },
    handler: async (args) => {
      const params = args.stage ? `?stage=${args.stage}` : '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/crm/deals${params}`);
      return res.json();
    },
  },
  {
    name: 'check_inventory',
    description: 'Check stock levels for inventory items',
    inputSchema: {
      type: 'object',
      properties: {
        sku: { type: 'string', description: 'Product SKU (optional)' },
        lowStock: { type: 'boolean', description: 'Filter low stock only' },
      },
    },
    handler: async (args) => {
      const params = new URLSearchParams();
      if (args.sku) params.set('sku', args.sku as string);
      if (args.lowStock) params.set('lowStock', 'true');
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/inventory/stock?${params}`);
      return res.json();
    },
  },
  {
    name: 'get_employee',
    description: 'Get employee details',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Employee ID' },
      },
      required: ['id'],
    },
    handler: async (args) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/hr/employees/${args.id}`);
      return res.json();
    },
  },
  {
    name: 'get_revenue_summary',
    description: 'Get revenue and financial summary',
    inputSchema: {
      type: 'object',
      properties: {
        period: { type: 'string', description: 'Period: month, quarter, year' },
      },
    },
    handler: async (args) => {
      const params = args.period ? `?period=${args.period}` : '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/reports/summary${params}`);
      return res.json();
    },
  },
  {
    name: 'create_support_ticket',
    description: 'Create a support/helpdesk ticket',
    inputSchema: {
      type: 'object',
      properties: {
        subject: { type: 'string', description: 'Ticket subject' },
        description: { type: 'string', description: 'Ticket description' },
        priority: { type: 'string', description: 'low, medium, high, urgent' },
      },
      required: ['subject', 'description'],
    },
    handler: async (args) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/support/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
      });
      return res.json();
    },
  },
];

// AINOS MCP Resources - data the AI can read
export const ainosResources: MCPResource[] = [
  {
    uri: 'ainos://dashboard/summary',
    name: 'Dashboard Summary',
    description: 'Key business metrics and KPIs',
    mimeType: 'application/json',
  },
  {
    uri: 'ainos://reports/revenue',
    name: 'Revenue Report',
    description: 'Revenue breakdown by period',
    mimeType: 'application/json',
  },
  {
    uri: 'ainos://inventory/low-stock',
    name: 'Low Stock Alert',
    description: 'Items below reorder level',
    mimeType: 'application/json',
  },
  {
    uri: 'ainos://compliance/overdue',
    name: 'Overdue Compliance Tasks',
    description: 'Tasks past their due date',
    mimeType: 'application/json',
  },
];

export const ainosMCPServer: MCPServerConfig = {
  name: 'AINOS Business Suite',
  version: '1.0.0',
  tools: ainosTools,
  resources: ainosResources,
};
