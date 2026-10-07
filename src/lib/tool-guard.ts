import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';

export type ToolName =
  | 'autoBlog'
  | 'invoiceGen'
  | 'crmAccess'
  | 'inventoryMgmt'
  | 'hrPayroll'
  | 'emailMarketing'
  | 'aiAssistant'
  | 'websiteGen';

export interface ToolAccessResult {
  companyId?: string;
  userId?: string;
  error?: string;
  status?: number;
  requiredTool?: string;
}

/**
 * Check if the current user has access to a specific tool.
 * Returns companyId and userId if access is granted, or error details if not.
 *
 * Usage:
 *   const access = await requireToolAccess('autoBlog');
 *   if ('error' in access) {
 *     return Response.json({ error: access.error }, { status: access.status });
 *   }
 *   // Proceed with access.companyId
 */
export async function requireToolAccess(toolName: ToolName): Promise<ToolAccessResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.companyId) {
    return {
      error: 'Unauthorized. Please log in and set up a company.',
      status: 401,
    };
  }

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    select: {
      [toolName]: true,
      subscriptionStatus: true,
    },
  });

  if (!company) {
    return {
      error: 'Company not found',
      status: 404,
    };
  }

  if (!company[toolName]) {
    return {
      error: `Tool access required. Please subscribe to activate ${toolName}.`,
      status: 402,
      requiredTool: toolName,
    };
  }

  return {
    companyId: session.user.companyId,
    userId: session.user.id,
  };
}

/**
 * Get the current company's tool access status for all tools.
 * Useful for dashboard UI to show which tools are locked/unlocked.
 */
export async function getCompanyToolStatus(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      autoBlog: true,
      invoiceGen: true,
      crmAccess: true,
      inventoryMgmt: true,
      hrPayroll: true,
      emailMarketing: true,
      aiAssistant: true,
      websiteGen: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
    },
  });

  if (!company) return null;

  return {
    tools: {
      autoBlog: company.autoBlog,
      invoiceGen: company.invoiceGen,
      crmAccess: company.crmAccess,
      inventoryMgmt: company.inventoryMgmt,
      hrPayroll: company.hrPayroll,
      emailMarketing: company.emailMarketing,
      aiAssistant: company.aiAssistant,
      websiteGen: company.websiteGen,
    },
    subscription: {
      status: company.subscriptionStatus,
      endsAt: company.subscriptionEndsAt,
    },
  };
}

/**
 * Map of tool names to their display labels and route prefixes.
 * Used by middleware and UI components.
 */
export const TOOL_CONFIG: Record<ToolName, { label: string; route: string }> = {
  autoBlog: { label: 'Auto Blog', route: '/marketing/blog' },
  invoiceGen: { label: 'Invoice Generator', route: '/finance/invoices' },
  crmAccess: { label: 'CRM', route: '/crm' },
  inventoryMgmt: { label: 'Inventory', route: '/inventory' },
  hrPayroll: { label: 'HR & Payroll', route: '/hr' },
  emailMarketing: { label: 'Email Marketing', route: '/marketing/email' },
  aiAssistant: { label: 'AI Assistant', route: '/ai-assistant' },
  websiteGen: { label: 'Website Builder', route: '/website-builder' },
};
