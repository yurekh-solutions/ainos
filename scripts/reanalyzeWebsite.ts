/* Re-analyze a connected website and update its topics + schedules.
   Usage: npx tsx scripts/reanalyzeWebsite.ts <website-url>
   Example: npx tsx scripts/reanalyzeWebsite.ts https://skyav.in
*/
import { PrismaClient } from '@prisma/client';
import { connectAndAnalyzeWebsite } from '../src/lib/website-scraper';

const prisma = new PrismaClient();

(async () => {
  const url = process.argv[2];
  if (!url) {
    console.log('Usage: npx tsx scripts/reanalyzeWebsite.ts <website-url>');
    process.exit(1);
  }

  const normalizedUrl = (url.startsWith('http') ? url : `https://${url}`).replace(/\/+$/, '');
  console.log(`Re-analyzing: ${normalizedUrl}`);

  // Find the connected website (match by normalized URL, ignoring trailing slashes)
  const website = await prisma.connectedWebsite.findFirst({
    where: {
      url: { startsWith: normalizedUrl },
      isActive: true,
    },
    include: {
      subscriptions: {
        include: {
          schedules: true,
        },
      },
    },
  });

  if (!website) {
    console.log(`Website not found in DB: ${normalizedUrl}`);
    // List all connected websites to help debug
    const all = await prisma.connectedWebsite.findMany({
      select: { url: true, name: true, niche: true, isActive: true },
    });
    console.log('Connected websites in DB:');
    for (const w of all) {
      console.log(`  ${w.url} | ${w.name} | niche=${w.niche} | active=${w.isActive}`);
    }
    process.exit(1);
  }

  console.log(`Found: ${website.name} (niche: ${website.niche})`);
  const allSchedules = website.subscriptions.flatMap(sub => sub.schedules);
  const pending = allSchedules.filter(s => ['pending', 'failed'].includes(s.status));
  const published = allSchedules.filter(s => s.status === 'published');
  console.log(`Schedules: ${allSchedules.length} total, ${pending.length} pending/failed, ${published.length} published`);

  // Re-scrape and re-analyze
  console.log('\nScraping and analyzing website...');
  const { scrapedData, analysis } = await connectAndAnalyzeWebsite(normalizedUrl);

  console.log(`\nNew niche: ${analysis.niche}`);
  console.log(`Topics: ${analysis.topics.length}`);
  console.log('\nFirst 10 topics:');
  analysis.topics.slice(0, 10).forEach((t, i) => console.log(`  ${i + 1}. ${t}`));

  // Update the website record
  await prisma.connectedWebsite.update({
    where: { id: website.id },
    data: {
      niche: analysis.niche,
      topics: analysis.topics,
      brandVoice: analysis.brandVoice,
      competitors: analysis.competitors,
      name: scrapedData.name || website.name,
      description: scrapedData.description || website.description,
      techStack: scrapedData.techStack || website.techStack,
    },
  });
  console.log('\n✔ Website record updated');

  // Update pending/failed schedules with new topics
  console.log(`\nUpdating ${pending.length} pending/failed schedules with new topics...`);
  const stopWords = new Set(['the','and','for','are','but','not','you','all','can','her','was','one','our','out','how','what','which','their','this','that','with','from','have','been','will','each','make','like','long','look','many','some','them','then','than','into','more','also','just','over','such','take','year','very','when','come','could','other','after','most','about','would','there','so','up','of','in','to','is','it','as','at','by','on','or','an','be','we','he','do','go','no','my']);

  for (let i = 0; i < pending.length; i++) {
    const schedule = pending[i];
    const newTopic = analysis.topics[i % analysis.topics.length];
    const topicWords = newTopic
      .split(/\s+/)
      .map(w => w.replace(/[^a-zA-Z0-9]/g, ''))
      .filter(w => w.length > 3 && !stopWords.has(w.toLowerCase()))
      .slice(0, 6);
    const keywords = [analysis.niche, ...topicWords].filter(Boolean).join(', ');

    await prisma.blogSchedule.update({
      where: { id: schedule.id },
      data: { topic: newTopic, keywords, status: 'pending' },
    });
    console.log(`  ✔ [${i + 1}/${pending.length}] ${newTopic.slice(0, 60)}`);
  }
  console.log(`\n✔ ${pending.length} schedules updated to "pending" with new topics`);
  console.log('\nDone! Blogs will now be written with topics specific to this business.');
  await prisma.$disconnect();
})();
