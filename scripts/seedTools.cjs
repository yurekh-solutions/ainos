const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Tool catalog with credit costs
const TOOLS = [
  // AI Tools (credit cost > 0)
  { slug: 'logo', name: 'Logo Generator', category: 'branding', creditCost: 5, description: 'Generate professional logos with AI' },
  { slug: 'brandkit', name: 'Brand Kit', category: 'branding', creditCost: 10, description: 'Complete branding package' },
  { slug: 'social', name: 'Social Media Pack', category: 'marketing', creditCost: 8, description: 'Social media content generator' },
  { slug: 'content', name: 'Content Writer', category: 'marketing', creditCost: 3, description: 'AI content and copy writer' },
  { slug: 'seo', name: 'SEO Audit', category: 'marketing', creditCost: 5, description: 'SEO analysis and recommendations' },
  { slug: 'email', name: 'Email Copy', category: 'marketing', creditCost: 3, description: 'Email campaign content generator' },
  { slug: 'pr', name: 'PR Outreach', category: 'marketing', creditCost: 5, description: 'Press release and PR kit' },
  { slug: 'launch', name: 'Launch Kit', category: 'marketing', creditCost: 15, description: 'Product launch package' },
  { slug: 'poster', name: 'Poster Design', category: 'design', creditCost: 5, description: 'AI poster and flyer designer' },
  { slug: 'qr', name: 'QR Code Generator', category: 'design', creditCost: 1, description: 'Custom QR code generator' },
  { slug: 'pitchdeck', name: 'Pitch Deck', category: 'business', creditCost: 10, description: 'Investor pitch deck creator' },
  { slug: 'listing', name: 'Product Listing', category: 'ecommerce', creditCost: 5, description: 'Marketplace product listing optimizer' },
  { slug: 'bizplan', name: 'Business Plan', category: 'business', creditCost: 15, description: 'Business plan generator' },
  { slug: 'legal', name: 'Legal Docs', category: 'business', creditCost: 8, description: 'Legal document templates' },
  { slug: 'chatbot', name: 'AI Chatbot', category: 'support', creditCost: 2, description: 'Custom chatbot builder' },
  
  // Business Suite Tools (mapped to Company tool levels)
  { slug: 'autoBlog', name: 'Auto Blog', category: 'content', creditCost: 5, description: 'AI blog post generator' },
  { slug: 'invoiceGen', name: 'Invoice Generator', category: 'finance', creditCost: 0, description: 'GST invoice generator (included with subscription)' },
  { slug: 'crmAccess', name: 'CRM', category: 'sales', creditCost: 0, description: 'Customer relationship management (included with subscription)' },
  { slug: 'inventoryMgmt', name: 'Inventory Management', category: 'operations', creditCost: 0, description: 'Stock and inventory tracking (included with subscription)' },
  { slug: 'hrPayroll', name: 'HR & Payroll', category: 'hr', creditCost: 0, description: 'Employee and payroll management (included with subscription)' },
  { slug: 'emailMarketing', name: 'Email Marketing', category: 'marketing', creditCost: 0, description: 'Email campaign manager (included with subscription)' },
  { slug: 'aiAssistant', name: 'AI Assistant', category: 'ai', creditCost: 2, description: 'Context-aware AI chatbot' },
  { slug: 'websiteGen', name: 'Website Builder', category: 'web', creditCost: 25, description: 'AI website generator' },
];

async function main() {
  console.log('🌱 Seeding Tool catalog...\n');

  for (const tool of TOOLS) {
    const existing = await prisma.tool.findUnique({
      where: { slug: tool.slug },
    });

    if (existing) {
      console.log(`⏭️  ${tool.name} (${tool.slug}) already exists, skipping`);
    } else {
      await prisma.tool.create({
        data: {
          slug: tool.slug,
          name: tool.name,
          category: tool.category,
          creditCost: tool.creditCost,
          description: tool.description,
          isActive: true,
        },
      });
      console.log(`✅ Created: ${tool.name} (${tool.slug}) — ${tool.creditCost} credits`);
    }
  }

  console.log('\n✅ Tool catalog seeded successfully!');
  console.log(`\nTotal tools: ${TOOLS.length}`);
  console.log(`AI tools (credit cost > 0): ${TOOLS.filter(t => t.creditCost > 0).length}`);
  console.log(`Business tools (credit cost = 0): ${TOOLS.filter(t => t.creditCost === 0).length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
