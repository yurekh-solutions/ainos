# AINOS Integer Level System — Implementation Guide

## ✅ Step 1: Schema Updated (DONE)

**File:** `prisma/schema.prisma`

### Changes Made:
1. **Company model** — Boolean fields converted to Integer levels:
```prisma
// OLD (Boolean)
autoBlog  Boolean  @default(false)

// NEW (Integer Levels)
autoBlog  Int  @default(0)  @map("auto_blog_level")
// 0=locked, 1=basic, 2=subscribed, 3=premium
```

2. **Subscription model** — Added credit grant fields:
```prisma
monthlyCreditGrant  Int  @default(0)
creditsRefreshedAt  DateTime?
```

---

## ✅ Step 2: Tool Guard Updated (DONE)

**File:** `src/lib/tool-guard.ts`

### New Features:
- Integer level checking (0, 1, 2, 3)
- Level 1 = 3 uses/month, 0 credits
- Level 2 = Unlimited, credits deduct
- Level 3 = Unlimited, 0 credits
- Helper functions: `downgradeToolsOnCancel()`, `upgradeToolsOnSubscribe()`

---

## 🔧 Step 3: Push Schema to Database (MANUAL)

**Run these commands:**

```bash
# Stop dev server first (Ctrl+C)
cd c:\Users\yurek\OneDrive\Desktop\yuvraj\ainos

# Generate Prisma client
npx prisma generate

# Push schema changes to database
npx prisma db push

# Seed Tool catalog
node scripts/seedTools.cjs
```

---

## 🔧 Step 4: Create Seed Script (MANUAL)

**File:** `scripts/seedTools.cjs`

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TOOLS = [
  // AI Tools (credit cost > 0)
  { slug: 'logo', name: 'Logo Generator', category: 'branding', creditCost: 5 },
  { slug: 'brandkit', name: 'Brand Kit', category: 'branding', creditCost: 10 },
  { slug: 'social', name: 'Social Media Pack', category: 'marketing', creditCost: 8 },
  { slug: 'content', name: 'Content Writer', category: 'marketing', creditCost: 3 },
  { slug: 'seo', name: 'SEO Audit', category: 'marketing', creditCost: 5 },
  { slug: 'email', name: 'Email Copy', category: 'marketing', creditCost: 3 },
  { slug: 'pr', name: 'PR Outreach', category: 'marketing', creditCost: 5 },
  { slug: 'launch', name: 'Launch Kit', category: 'marketing', creditCost: 15 },
  { slug: 'poster', name: 'Poster Design', category: 'design', creditCost: 5 },
  { slug: 'qr', name: 'QR Code Generator', category: 'design', creditCost: 1 },
  { slug: 'pitchdeck', name: 'Pitch Deck', category: 'business', creditCost: 10 },
  { slug: 'listing', name: 'Product Listing', category: 'ecommerce', creditCost: 5 },
  { slug: 'bizplan', name: 'Business Plan', category: 'business', creditCost: 15 },
  { slug: 'legal', name: 'Legal Docs', category: 'business', creditCost: 8 },
  { slug: 'chatbot', name: 'AI Chatbot', category: 'support', creditCost: 2 },
  
  // Business Suite Tools
  { slug: 'autoBlog', name: 'Auto Blog', category: 'content', creditCost: 5 },
  { slug: 'invoiceGen', name: 'Invoice Generator', category: 'finance', creditCost: 0 },
  { slug: 'crmAccess', name: 'CRM', category: 'sales', creditCost: 0 },
  { slug: 'inventoryMgmt', name: 'Inventory', category: 'operations', creditCost: 0 },
  { slug: 'hrPayroll', name: 'HR & Payroll', category: 'hr', creditCost: 0 },
  { slug: 'emailMarketing', name: 'Email Marketing', category: 'marketing', creditCost: 0 },
  { slug: 'aiAssistant', name: 'AI Assistant', category: 'ai', creditCost: 2 },
  { slug: 'websiteGen', name: 'Website Builder', category: 'web', creditCost: 25 },
];

async function main() {
  console.log('🌱 Seeding Tool catalog...\n');

  for (const tool of TOOLS) {
    const existing = await prisma.tool.findUnique({
      where: { slug: tool.slug },
    });

    if (existing) {
      console.log(`⏭️  ${tool.name} already exists`);
    } else {
      await prisma.tool.create({
        data: {
          slug: tool.slug,
          name: tool.name,
          category: tool.category,
          creditCost: tool.creditCost,
          isActive: true,
        },
      });
      console.log(`✅ ${tool.name} — ${tool.creditCost} credits`);
    }
  }

  console.log('\n✅ Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## 🔧 Step 5: Update AI Tools API (MANUAL)

**File:** `src/app/api/ai-tools/route.ts`

**Add credit deduction logic:**

```typescript
import { deductCredits } from '@/lib/credits';
import { requireToolAccess } from '@/lib/tool-guard';

export async function POST(req: NextRequest) {

  // NEW: Check tool access with integer levels
  const access = await requireToolAccess(tool);
  if ('error' in access) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status }
    );
  }

  // NEW: Check credit balance
  if (access.creditsRequired > 0) {
    const balance = await getCreditBalance(access.companyId);
    if (balance < access.creditsRequired) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits',
          required: access.creditsRequired,
          balance: balance,
          buyLink: '/billing/credits'
        },
        { status: 402 }
      );
    }
  }

  // Execute tool
  const output = await runTool(tool, inputs);

  // NEW: Deduct credits (if required)
  if (access.creditsRequired > 0) {
    await deductCredits(
      access.companyId,
      access.creditsRequired,
      `${tool} tool run`
    );
  }

  // Save tool run
  await prisma.toolRun.create({
    data: {
      tool,
      toolName: tool,
      // ... existing fields ...
      companyId: access.companyId,
      userId: access.userId,
    },
  });

  return NextResponse.json(output);
}
```

---

## 🔧 Step 6: Update Billing Activation (MANUAL)

**File:** `src/app/api/billing/activate-tools/route.ts`

**Use new upgrade function:**

```typescript
import { upgradeToolsOnSubscribe } from '@/lib/tool-guard';

export async function POST(req: NextRequest) {
  // ... existing payment verification ...

  // NEW: Upgrade tools based on plan
  await upgradeToolsOnSubscribe(session.user.companyId, plan);

  // Create subscription with credit grant
  const creditGrants = {
    starter: 500,
    growth: 2000,
    enterprise: 5000,
    one: 5000,
  };

  await prisma.subscription.create({
    data: {
      companyId: session.user.companyId,
      userId: session.user.id,
      plan: plan,
      status: 'active',
      monthlyCreditGrant: creditGrants[plan] || 0,
      creditsRefreshedAt: new Date(),
      // ... other fields ...
    },
  });

  // Add initial credits
  await addCredits(
    session.user.companyId,
    creditGrants[plan] || 0,
    `Monthly grant: ${plan} plan`
  );

  return NextResponse.json({ success: true });
}
```

---

## 🔧 Step 7: Add Cancel Handler (MANUAL)

**File:** `src/app/api/billing/cancel/route.ts` (NEW FILE)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { downgradeToolsOnCancel } from '@/lib/tool-guard';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Cancel subscription
  await prisma.subscription.updateMany({
    where: { companyId: session.user.companyId },
    data: { status: 'cancelled' },
  });

  // Downgrade tools
  await downgradeToolsOnCancel(session.user.companyId);

  // Update company status
  await prisma.company.update({
    where: { id: session.user.companyId },
    data: { subscriptionStatus: 'inactive' },
  });

  // Credits remain safe (no change)

  return NextResponse.json({ 
    success: true,
    message: 'Subscription cancelled. Tools downgraded to basic level.'
  });
}
```

---

## 📊 Summary: What's Built vs What's Manual

| Step | Status | Action |
|------|--------|--------|
| 1. Schema Update | ✅ DONE | `npx prisma generate && npx prisma db push` |
| 2. Tool Guard | ✅ DONE | Already updated |
| 3. Seed Script | 🔧 MANUAL | Create `scripts/seedTools.cjs` and run |
| 4. AI Tools API | 🔧 MANUAL | Add credit deduction logic |
| 5. Billing Activation | 🔧 MANUAL | Use `upgradeToolsOnSubscribe()` |
| 6. Cancel Handler | 🔧 MANUAL | Create new file |

---

## 🚀 Commands to Run (After Dev Server Stop)

```bash
cd c:\Users\yurek\OneDrive\Desktop\yuvraj\ainos

# Stop dev server (Ctrl+C if running)

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Create seed script (copy from Step 4)
# Then run:
node scripts/seedTools.cjs

# Restart dev server
npm run dev
```

---

## 🎯 Testing Checklist

- [ ] New user signup → Level 1 tools (3 uses/month)
- [ ] Level 1 user hits 3 uses → "Upgrade" message
- [ ] Subscribe to AINOS One → Level 3 tools (unlimited, 0 credits)
- [ ] Level 3 user runs AI tool → No credits deducted
- [ ] Cancel subscription → Tools downgrade to Level 1/0
- [ ] Credits remain after cancel
- [ ] Buy credit pack → Credits added to wallet

---

**Document Version:** 1.0  
**Last Updated:** 2026-10-07  
**Status:** Implementation Guide Ready
