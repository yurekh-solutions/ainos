// One-off backfill: give every pending/failed schedule a real Pexels photo —
// fills missing previewImage AND replaces low-quality Pollinations previews.
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const envLocal = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const KEY = (envLocal.match(/PEXELS_API_KEY=(.+)/) || [])[1]?.trim();

const STOP = new Set(['the','a','an','and','or','but','if','for','nor','on','in','of','to','from','by','at','with','about','into','over','after','before','between','under','during','through','how','what','when','where','why','which','who','whom','this','that','these','those','is','are','was','were','be','been','being','do','does','did','will','would','shall','should','may','might','must','can','could','vs','via','your','you','their','they','our','we','my','it','its','as','per','out','up','down','off','again','more','most','best','top','guide','checklist','complete','ultimate','essential','ways','tips']);

function buildQuery(topic, context) {
  const words = topic.split(/[^a-zA-Z0-9]+/).filter(w => w.length > 2 && !STOP.has(w.toLowerCase()));
  return ((context ? context + ' ' : '') + words.slice(0, 4).join(' ')).trim() || 'business';
}

async function getBlogImage(topic, context) {
  const query = buildQuery(topic, context);
  let hash = 7;
  for (const ch of topic) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  if (KEY) {
    try {
      const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`, { headers: { Authorization: KEY } });
      if (res.ok) {
        const data = await res.json();
        const photos = data.photos || [];
        if (photos.length) {
          const pick = photos[hash % photos.length];
          const url = (pick.src && (pick.src.large || pick.src.landscape));
          if (url) return url;
        }
      }
    } catch { /* fall through */ }
  }
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(`Professional blog header image about ${topic}, modern business concept, clean design, high quality, 16:9`)}?width=1200&height=630&nologo=true&seed=${hash % 100000}`;
}

const prisma = new PrismaClient();
(async () => {
  const rows = await prisma.blogSchedule.findMany({
    where: {
      status: { in: ['pending', 'failed', 'generating'] },
      OR: [
        { previewImage: null },
        { previewImage: { contains: 'pollinations' } },
      ],
    },
    include: { subscription: { include: { connectedWebsite: true } } },
  });
  console.log('Schedules needing a real photo:', rows.length);
  for (const s of rows) {
    const niche = (s.subscription && s.subscription.connectedWebsite && s.subscription.connectedWebsite.niche) || undefined;
    const url = await getBlogImage(s.topic, niche);
    await prisma.blogSchedule.update({ where: { id: s.id }, data: { previewImage: url } });
    console.log('  ✔', s.topic.slice(0, 60));
  }
  await prisma.$disconnect();
  console.log('Backfill done.');
})();
