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

// Access Levels
export const ACCESS_LEVELS = {
  LOCKED: 0,      // No access
  BASIC: 1,       // Limited use (3/month, 0 credits)
  SUBSCRIBED: 2,  // Unlimited (credits deduct)
  PREMIUM: 3,     // Unlimited (0 credits)
} as const;

export interface ToolAccessResult {
  companyId?: string;
  userId?: string;
  level?: number;
  creditsRequired?: number;
  error?: string;
  status?: number;
  requiredTool?: string;
}

/**
 * Check if the current user has access to a specific tool.
 * Returns access details including level and credit requirements.
 * 
 * Levels:
 * 0 = Locked (no access)
 * 1 = Basic (3 uses/month, 0 credits)
 * 2 = Subscribed (unlimited, credits deduct)
 * 3 = Premium (unlimited, 0 credits)
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

  const level = company[toolName] as unknown as number;

  // Level 0: Locked
  if (level === ACCESS_LEVELS.LOCKED) {
    return {
      error: `Tool locked. Subscribe to unlock ${toolName}.`,
      status: 402,
      requiredTool: toolName,
      level: 0,
    };
  }

  // Level 1: Basic (limited uses)
  if (level === ACCESS_LEVELS.BASIC) {
    const userId = session.user.id || session.user.email;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const used = await prisma.toolRun.count({
      where: {
        createdBy: userId,
        tool: toolName,
        createdAt: { gte: startOfMonth },
      },
    });

    if (used >= 3) {
      return {
        error: `3/3 uses done this month. Upgrade to Level 2 for unlimited access.`,
        status: 402,
        requiredTool: toolName,
        level: 1,
      };
    }

    return {
      companyId: session.user.companyId,
      userId: session.user.id,
      level: 1,
      creditsRequired: 0, // Basic level = 0 credits
    };
  }

  // Level 2: Subscribed (unlimited, credits deduct)
  if (level === ACCESS_LEVELS.SUBSCRIBED) {
    // Get credit cost from Tool table
    const tool = await prisma.tool.findUnique({
      where: { slug: toolName },
      select: { creditCost: true },
    });

    return {
      companyId: session.user.companyId,
      userId: session.user.id,
      level: 2,
      creditsRequired: tool?.creditCost || 5, // Default 5 if not found
    };
  }

  // Level 3: Premium (unlimited, 0 credits)
  if (level === ACCESS_LEVELS.PREMIUM) {
    return {
      companyId: session.user.companyId,
      userId: session.user.id,
      level: 3,
      creditsRequired: 0, // Premium = 0 credits
    };
  }

  return {
    error: 'Invalid access level',
    status: 500,
  };
}

/**
 * Get the current company's tool access levels for all tools.
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

/**
 * Downgrade all tools when subscription is cancelled/expired.
 * Level 2 → Level 1 (for AI tools) or Level 0 (for non-AI tools)
 */
export async function downgradeToolsOnCancel(companyId: string) {
  await prisma.company.update({
    where: { id: companyId },
    data: {
      // AI tools → Level 1 (basic, 3/month)
      autoBlog: 1,
      aiAssistant: 1,
      websiteGen: 1,
      emailMarketing: 1,
      
      // Non-AI tools → Level 0 (locked)
      invoiceGen: 0,
      crmAccess: 0,
      inventoryMgmt: 0,
      hrPayroll: 0,
    },
  });
}

/**
 * Upgrade tools when subscription is activated.
 */
export async function upgradeToolsOnSubscribe(
  companyId: string, 
  plan: 'starter' | 'growth' | 'enterprise' | 'one'
) {
  const upgrades: Record<string, Record<string, number>> = {
    starter: {
      autoBlog: 2,
      invoiceGen: 2,
      crmAccess: 2,
    },
    growth: {
      autoBlog: 2,
      invoiceGen: 2,
      crmAccess: 2,
      inventoryMgmt: 2,
      hrPayroll: 2,
      emailMarketing: 2,
    },
    enterprise: {
      autoBlog: 2,
      invoiceGen: 2,
      crmAccess: 2,
      inventoryMgmt: 2,
      hrPayroll: 2,
      emailMarketing: 2,
      aiAssistant: 2,
      websiteGen: 2,
    },
    one: {
      autoBlog: 3,
      invoiceGen: 3,
      crmAccess: 3,
      inventoryMgmt: 3,
      hrPayroll: 3,
      emailMarketing: 3,
      aiAssistant: 3,
      websiteGen: 3,
    },
  };

  const levels = upgrades[plan] || upgrades.starter;

  await prisma.company.update({
    where: { id: companyId },
    data: levels,
  });
}
