// Seed script to add sample tools to the database
// Run: node seed-tools.cjs

const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    process.env[key.trim()] = valueParts.join('=').replace(/^["']|["']$/g, '').trim();
  }
});

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sampleTools = [
  {
    name: 'AI Content Writer',
    slug: 'ai-content-writer',
    description: 'Generate blog posts, emails, and marketing copy using AI',
    category: 'ai',
    creditCost: 10,
    isActive: true,
    handlerCode: `
      async function main(input) {
        const prompt = input.topic || 'general topic';
        const response = await fetch('https://text.pollinations.ai/' + encodeURIComponent('Write about: ' + prompt));
        const content = await response.text();
        return { content, wordCount: content.split(' ').length };
      }
      return main(input);
    `
  },
  {
    name: 'Email Campaign Sender',
    slug: 'email-campaign-sender',
    description: 'Send bulk emails to your contacts with personalized templates',
    category: 'marketing',
    creditCost: 5,
    isActive: true,
    handlerCode: `
      async function main(input) {
        return { success: true, message: 'Email campaign queued', recipients: input.recipients || 0 };
      }
      return main(input);
    `
  },
  {
    name: 'Lead Scoring AI',
    slug: 'lead-scoring-ai',
    description: 'Automatically score and prioritize your leads using AI analysis',
    category: 'crm',
    creditCost: 3,
    isActive: true,
    handlerCode: `
      async function main(input) {
        const score = Math.floor(Math.random() * 100);
        return { score, recommendation: score > 70 ? 'High priority' : score > 40 ? 'Medium priority' : 'Low priority' };
      }
      return main(input);
    `
  },
  {
    name: 'Invoice Generator',
    slug: 'invoice-generator',
    description: 'Generate professional PDF invoices from your data',
    category: 'finance',
    creditCost: 2,
    isActive: true,
    handlerCode: `
      async function main(input) {
        return { success: true, invoiceNumber: 'INV-' + Date.now(), format: 'PDF' };
      }
      return main(input);
    `
  },
  {
    name: 'Social Media Post Generator',
    slug: 'social-media-generator',
    description: 'Create engaging social media posts for all platforms',
    category: 'marketing',
    creditCost: 5,
    isActive: true,
    handlerCode: `
      async function main(input) {
        const platforms = ['Twitter', 'LinkedIn', 'Instagram', 'Facebook'];
        const posts = platforms.map(p => ({ platform: p, content: 'Post about: ' + (input.topic || 'your business') }));
        return { posts };
      }
      return main(input);
    `
  },
  {
    name: 'Data Export Tool',
    slug: 'data-export',
    description: 'Export your CRM data to CSV or Excel format',
    category: 'productivity',
    creditCost: 2,
    isActive: true,
    handlerCode: `
      async function main(input) {
        return { success: true, format: input.format || 'CSV', records: 0 };
      }
      return main(input);
    `
  }
];

async function seed() {
  console.log('Seeding tools...');
  
  for (const tool of sampleTools) {
    try {
      await prisma.tool.upsert({
        where: { slug: tool.slug },
        update: tool,
        create: tool
      });
      console.log(`  ✓ ${tool.name}`);
    } catch (error) {
      console.error(`  ✗ ${tool.name}: ${error.message}`);
    }
  }

  console.log('\nDone! Tools seeded successfully.');
  await prisma.$disconnect();
}

seed().catch(console.error);
