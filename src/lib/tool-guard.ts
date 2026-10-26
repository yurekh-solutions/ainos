import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { getActiveApps } from '@/lib/billing';

export type ToolName =
  | 'autoBlog'
  | 'invoiceGen'
  | 'crmAccess'
  | 'inventoryMgmt'
  | 'hrPayroll'
  | 'emailMarketing'
  | 'aiAssistant'
  | 'websiteGen';

// Marketing vertical = ONE plan that unlocks every marketing tool (category-level
// granularity, per the approved model). Any slug below is gated behind the higher
// of the company's `autoBlog` / `emailMarketing` access levels.
export const MARKETING_TOOL_SLUGS: string[] = [
  'autoBlog',
  'emailMarketing',
  'ai-content-writer',
  'social-media-generator',
  'email-campaign-sender',
  'social',
  'content',
  'seo',
  'email',
  'pr',
  'launch',
  'poster',
  'brandkit',
  'logo',
];

// Direct 1:1 slugs that map to a single module flag (Business Suite tools).
const FLAG_BY_SLUG: Record<string, ToolName> = {
  autoBlog: 'autoBlog',
  invoiceGen: 'invoiceGen',
  crmAccess: 'crmAccess',
  inventoryMgmt: 'inventoryMgmt',
  hrPayroll: 'hrPayroll',
  emailMarketing: 'emailMarketing',
  aiAssistant: 'aiAssistant',
  websiteGen: 'websiteGen',
};

export function isMarketingSlug(slug: string): boolean {
  return MARKETING_TOOL_SLUGS.includes(slug);
}

// Developer / tester allow-list: these accounts get full access to every tool,
// bypassing subscription gating and credit deduction entirely. This is purely
// for internal QA — remove or empty the list before public launch. Additional
// emails can be appended at runtime via DEV_TOOL_ACCESS_EMAILS (comma-separated).
const DEVELOPER_EMAILS: string[] = [
  'soniajaiswal2222@gmail.com',
  'info.ainosio@gmail.com',
];

export function isDeveloperEmail(email?: string | null): boolean {
  if (!email) return false;
  const e = email.toLowerCase().trim();
  const fromEnv = (process.env.DEV_TOOL_ACCESS_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return DEVELOPER_EMAILS.includes(e) || fromEnv.includes(e);
}

/**
 * A single, session-free access decision used by both the tool runner and the
 * /api/tools listing. Encodes the two-axis model:
 *   - Access (subscription) decides WHETHER a tool can run.
 *   - Credits (usage) decide HOW OFTEN; charged only at level 2.
 * Levels: 0 locked, 1 basic (3 runs/mo, free), 2 subscribed (credits deduct),
 * 3 premium (unlimited, free). Non-gated tools default to level 2 so the
 * pre-existing credits-only behaviour is preserved.
 */
export interface AccessDecision {
  allowed: boolean;
  level: number;
  creditsRequired: number;
  blockedReason?: string;
  requiredTool?: ToolName;
  requiredPlan?: string;
  status?: number;
}

async function readLevels(companyId: string) {
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
    },
  });
  return company;
}

export async function resolveToolAccess(
  companyId: string,
  userId: string,
  slug: string,
  creditCost: number,
  email?: string
): Promise<AccessDecision> {
  // Developer/tester bypass: full access to every tool, no subscription, no credits.
  if (isDeveloperEmail(email)) {
    return { allowed: true, level: ACCESS_LEVELS.PREMIUM, creditsRequired: 0 };
  }

  // Non-gated tools: keep the credits-only behaviour (level 2 semantics).
  if (!isMarketingSlug(slug) && !FLAG_BY_SLUG[slug]) {
    return { allowed: true, level: ACCESS_LEVELS.SUBSCRIBED, creditsRequired: creditCost };
  }

  const company = await readLevels(companyId);
  if (!company) {
    return { allowed: false, level: 0, creditsRequired: 0, status: 404, blockedReason: 'Company not found' };
  }

  let level: number;
  let requiredTool: ToolName;
  let requiredPlan: string;

  if (FLAG_BY_SLUG[slug] && !isMarketingSlug(slug)) {
    requiredTool = FLAG_BY_SLUG[slug];
    level = (company as unknown as Record<string, number>)[requiredTool];
    requiredPlan = requiredTool;
  } else {
    // Marketing aggregate: unlock if either marketing flag grants access.
    requiredTool = 'emailMarketing';
    requiredPlan = 'marketing';
    level = Math.max(company.autoBlog, company.emailMarketing);
    // AI Studio subscribers already paid for the content tools — don't double-lock.
    if (level < ACCESS_LEVELS.SUBSCRIBED) {
      const apps = await getActiveApps(companyId);
      if (apps.has('ai_studio')) level = ACCESS_LEVELS.SUBSCRIBED;
    }
  }

  if (level <= ACCESS_LEVELS.LOCKED) {
    return {
      allowed: false,
      level: ACCESS_LEVELS.LOCKED,
      creditsRequired: 0,
      status: 402,
      requiredTool,
      requiredPlan,
      blockedReason: 'Tool locked. Subscribe to unlock.',
    };
  }

  if (level === ACCESS_LEVELS.BASIC) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const used = await prisma.toolRun.count({
      where: { createdBy: userId, createdAt: { gte: startOfMonth }, tool: { in: MARKETING_TOOL_SLUGS } },
    });
    if (used >= 3) {
      return {
        allowed: false,
        level: ACCESS_LEVELS.BASIC,
        creditsRequired: 0,
        status: 402,
        requiredTool,
        requiredPlan,
        blockedReason: 'You have used all 3 included runs this month. Upgrade to keep going.',
      };
    }
    return { allowed: true, level: ACCESS_LEVELS.BASIC, creditsRequired: 0 };
  }

  if (level === ACCESS_LEVELS.SUBSCRIBED) {
    return { allowed: true, level: ACCESS_LEVELS.SUBSCRIBED, creditsRequired: creditCost };
  }

  // Level 3 premium: unlimited, no credits.
  return { allowed: true, level: ACCESS_LEVELS.PREMIUM, creditsRequired: 0 };
}

/**
 * Lightweight access snapshot for the /api/tools listing — reads company flags
 * and AI Studio app once so each tool can be annotated without a per-tool query.
 */
export async function summarizeAccess(companyId: string | null, email?: string) {
  // Developer/tester: mark everything unlocked regardless of company flags.
  if (isDeveloperEmail(email)) {
    return {
      company: { autoBlog: 3, invoiceGen: 3, crmAccess: 3, inventoryMgmt: 3, hrPayroll: 3, emailMarketing: 3, aiAssistant: 3, websiteGen: 3 },
      aiStudio: true,
      marketingLevel: ACCESS_LEVELS.PREMIUM,
      dev: true,
    };
  }
  if (!companyId) return null;
  const company = await readLevels(companyId);
  if (!company) return null;
  const apps = await getActiveApps(companyId);
  const aiStudio = apps.has('ai_studio');
  const marketingLevel = aiStudio
    ? Math.max(company.autoBlog, company.emailMarketing, ACCESS_LEVELS.SUBSCRIBED)
    : Math.max(company.autoBlog, company.emailMarketing);
  return { company, aiStudio, marketingLevel, dev: false };
}

export type AccessSummary = NonNullable<Awaited<ReturnType<typeof summarizeAccess>>>;

/** Given an access snapshot, return the effective level for a tool slug. */
export function levelForSlug(slug: string, summary: AccessSummary): number {
  if (summary.dev) return ACCESS_LEVELS.PREMIUM;
  if (isMarketingSlug(slug)) return summary.marketingLevel;
  const flag = FLAG_BY_SLUG[slug];
  if (flag) return (summary.company as unknown as Record<string, number>)[flag];
  return ACCESS_LEVELS.SUBSCRIBED; // non-gated tools are always runnable
}

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

  const companyId = session.user.companyId;
  const userId = session.user.id || (session.user.email as string);

  // Reuse the shared decision engine so module gating and the tool runner can
  // never diverge. The toolName doubles as the slug for Business Suite tools.
  const tool = await prisma.tool.findUnique({
    where: { slug: toolName },
    select: { creditCost: true },
  });
  const decision = await resolveToolAccess(companyId, userId, toolName, tool?.creditCost ?? 5, session.user.email ?? undefined);

  return {
    companyId,
    userId,
    level: decision.level,
    creditsRequired: decision.creditsRequired,
    error: decision.allowed ? undefined : decision.blockedReason,
    status: decision.status,
    requiredTool: decision.requiredTool,
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
  emailMarketing: { label: 'Email Marketing', route: '/marketing/social-media' },
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
