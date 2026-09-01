import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  // 1. Check existing company IDs
  const companies = await p.company.findMany({
    select: { id: true, name: true }
  });
  console.log('COMPANIES:', companies);

  // 2. Add new cosmetic website (use first company)
  if (companies.length === 0) {
    console.log('No companies found');
    return;
  }
  const compId = companies[0].id;

  // Use a real, accessible cosmetic website URL
  const newSite = await p.connectedWebsite.upsert({
    where: { id: 'test-cosmetic-site-1' },
    update: {},
    create: {
      id: 'test-cosmetic-site-1',
      url: 'https://www.maybelline.com',
      niche: 'Beauty & Cosmetics',
      name: 'Maybelline (test)',
      description: 'Test cosmetic brand website for blog generator',
      companyId: compId,
      isActive: true,
      topics: ['lipstick shades', 'foundation matching', 'eye makeup tutorials', 'skincare routines', 'mascara reviews'],
    },
  });
  console.log('\nNEW SITE:', newSite);

  // 3. Add a blog subscription if not exists
  await p.blogSubscription.upsert({
    where: { id: 'test-cosmetic-sub-1' },
    update: {},
    create: {
      id: 'test-cosmetic-sub-1',
      connectedWebsiteId: newSite.id,
      companyId: compId,
      plan: 'pro',
      schedulePattern: 'daily',
      blogsPerMonth: 30,
      blogsUsed: 0,
      blogsRemaining: 30,
      autoSchedule: true,
    },
  });

  // 4. Add 5 test blog schedules
  const topics = [
    'How to Choose the Perfect Lipstick Shade for Your Skin Tone',
    'The Complete Foundation Matching Guide for Indian Skin',
    'Top 10 Eye Makeup Trends That Will Define This Year',
    'Beginner Skincare Routine: A Step-by-Step Guide for Glowing Skin',
    'How to Apply Mascara Like a Pro: Techniques That Actually Work',
  ];
  const tones = ['friendly, expert beauty advisor tone', 'professional dermatologist tone'];
  for (let i = 0; i < topics.length; i++) {
    const sched = await p.blogSchedule.create({
      data: {
        id: `test-cosmetic-sched-${i+1}`,
        connectedWebsiteId: newSite.id,
        subscriptionId: 'test-cosmetic-sub-1',
        companyId: compId,
        topic: topics[i],
        keywords: `cosmetic, beauty, ${topics[i].split(' ').slice(0, 3).join(', ').toLowerCase()}`,
        tone: tones[i % 2],
        targetWordCount: 3000,
        scheduledDate: new Date(Date.now() - (5 - i) * 86400000),
        status: 'pending',
      },
    });
    console.log(`Schedule ${i+1}: ${sched.id.slice(0, 8)} - ${topics[i].slice(0, 50)}`);
  }

  console.log('\n=== READY ===');
  console.log('Test site created with 5 pending schedules.');
  await p.$disconnect();
})();
