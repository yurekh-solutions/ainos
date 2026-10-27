// Featured-image provider for AINOS blogs.
// Primary: Pexels real photos (PEXELS_API_KEY) — premium, contextual imagery.
// Secondary: Unsplash (UNSPLASH_ACCESS_KEY).
// Fallback: Pollinations.ai AI-generated image (flux-realism model, Full HD).

const fallbackImage = (topic: string, seed: number, context?: string) => {
  const visualConcept = getVisualConcept(topic, context);
  const prompt = [
    visualConcept,
    'professional editorial photography',
    'shallow depth of field, bokeh background',
    'natural warm lighting, golden hour',
    'clean minimalist composition',
    'high detail, sharp focus, 8K quality',
    'no text, no watermarks, no logos, no people faces',
  ].join(', ');
  const params = new URLSearchParams({
    width: '1920',
    height: '1080',
    model: 'flux-realism',
    enhance: 'true',
    nologo: 'true',
    seed: String(seed),
    negative: 'blurry, low quality, distorted, watermark, text, logo, ugly, deformed, oversaturated, cartoon, anime, illustration, drawing, painting',
  });
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params.toString()}`;
};

// Words that add no visual meaning — dropped so image search hits the real subject
const STOPWORDS = new Set(['the','a','an','and','or','but','if','for','nor','on','in','of','to','from','by','at','with','about','into','over','after','before','between','under','during','through','how','what','when','where','why','which','who','whom','this','that','these','those','is','are','was','were','be','been','being','do','does','did','will','would','shall','should','may','might','must','can','could','vs','via','your','you','their','they','our','we','my','it','its','as','per','out','up','down','off','again','more','most','best','top','guide','checklist','complete','ultimate','essential','ways','tips']);

// Abstract / non-visual words that produce irrelevant stock photos
const ABSTRACT_WORDS = new Set(['guide','plan','action','strategy','strategies','steps','tips','checklist','complete','ultimate','essential','measure','success','kpi','kpis','metrics','results','zero','build','building','first','regulations','regulation','compliance','must','know','impact','impacts','customer','experience','loyalty','budget','smart','compromise','quality','actually','matter','terms','glossary','client','should','every','psychology','behind','decisions','directly','flawless','events','celebrations','step','day','flawless','what','every','business','latest','trends','expert','cost','saving','discover','execute','corporate','grand','practical','insights','actionable','behind','smart','decisions','agency','agencies','framework','execution','digital','marketing','online','internet','web','website','seo','sem','ppc','social','media','content','brand','branding']);

// Map abstract topics to concrete visual concepts
const TOPIC_VISUAL_MAP: Record<string, string> = {
  'av': 'professional audio visual equipment with speakers, projector and stage lighting',
  'audio': 'professional sound equipment with speakers and mixing console',
  'jeans': 'premium denim jeans with detailed fabric texture in a fashion studio',
  'fashion': 'curated clothing collection with detailed fabric textures in a fashion studio',
  'marketing': 'modern marketing team brainstorming with charts and graphs on whiteboard',
  'digital': 'person working on laptop with analytics dashboard',
  'agency': 'creative office workspace with design mockups',
  'seo': 'search engine optimization concept with magnifying glass over website',
  'finance': 'financial charts and graphs on tablet',
  'technology': 'modern tech workspace with multiple screens',
  'healthcare': 'doctor using digital tablet in modern clinic',
  'ecommerce': 'online shopping concept with packages and laptop',
  'education': 'student learning with laptop and books',
  'real estate': 'modern architectural building exterior',
  'saas': 'cloud software dashboard on multiple devices',
  'hr': 'professional team collaboration in modern office',
  'legal': 'law books and gavel on wooden desk',
  'crypto': 'digital currency concept with blockchain visualization',
  'ai': 'artificial intelligence concept with neural network visualization',
  'automation': 'robotic arm working in modern factory',
  'design': 'graphic designer working on creative project',
  'photography': 'professional camera with lens on tripod',
  'travel': 'scenic destination with landmark',
  'food': 'beautifully plated gourmet dish',
};

function getVisualConcept(topic: string, context?: string): string {
  const lowerTopic = topic.toLowerCase();
  const lowerContext = (context || '').toLowerCase();

  // Prefer the article's subject before its broader niche. Word boundaries
  // prevent short terms like "ai" from matching unrelated words like "retail".
  for (const text of [lowerTopic, lowerContext]) {
    for (const [keyword, visual] of Object.entries(TOPIC_VISUAL_MAP)) {
      if (new RegExp(`\\b${keyword}\\b`, 'i').test(text)) return visual;
    }
  }

  // Extract concrete nouns from topic
  const words = topic.split(/[^a-zA-Z0-9]+/).filter(w => w.length > 3 && !STOPWORDS.has(w.toLowerCase()) && !ABSTRACT_WORDS.has(w.toLowerCase()));
  if (words.length > 0) {
    return `professional ${words.slice(0, 3).join(' ')} concept`;
  }

  return 'professional business concept';
}

export async function getBlogImage(topic: string, context?: string): Promise<string> {
  // Search on a clean, concrete visual phrase derived from the article's subject
  // (or its niche via TOPIC_VISUAL_MAP). The old approach dumped the entire niche
  // string + title word-fragments into the query — e.g. "Premium Real Estate and
  // Commercial Deep Enclave in Mumbai luxury apartments" — which made Pexels
  // return generic Mumbai slum/skyline aerials instead of the actual subject.
  const visual = getVisualConcept(topic, context)
    .replace(/\b(professional|concept)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  const query = visual || 'business';
  // Stable per-topic hash so every blog gets its OWN photo (Date-based seeds
  // made blogs created in the same loop pick the identical image)
  let hash = 7;
  for (const ch of topic) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const seed = hash % 100000;

  // 1) Pexels — real high-quality photos
  if (process.env.PEXELS_API_KEY) {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=20&orientation=landscape`,
        { headers: { Authorization: process.env.PEXELS_API_KEY }, signal: AbortSignal.timeout(15_000) }
      );
      if (res.ok) {
        const data: { photos?: Array<{ src?: { large?: string; landscape?: string } }> } = await res.json();
        const photos = data.photos || [];
        if (photos.length) {
          const pick = photos[hash % photos.length];
          // landscape is a 1200x627 crop — the exact blog card / OG ratio
          const url = pick.src?.landscape || pick.src?.large;
          if (url) return url;
        }
      }
    } catch { /* fall through to next provider */ }
  }

  // 2) Unsplash — real high-quality photos
  if (process.env.UNSPLASH_ACCESS_KEY) {
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=20&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` }, signal: AbortSignal.timeout(15_000) }
      );
      if (res.ok) {
        const data: { results?: Array<{ urls?: { regular?: string } }> } = await res.json();
        const results = data.results || [];
        if (results.length) {
          const pick = results[hash % results.length];
          const url = pick.urls?.regular;
          if (url) return url;
        }
      }
    } catch { /* fall through to next provider */ }
  }

  // 3) Pollinations generated image (no key required)
  return fallbackImage(topic, seed, context);
}

// True when the URL actually serves a real image (not an error page/JSON).
async function imageLoads(url: string, timeoutMs: number): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok || !(res.headers.get('content-type') || '').startsWith('image/')) return false;
    const buf = await res.arrayBuffer();
    return buf.byteLength > 8_000;
  } catch {
    return false;
  }
}

// Verify the image before publishing. Providers may become unavailable later,
// so the widget also handles loading errors. Retry generated images once.
export async function getVerifiedBlogImage(topic: string, context?: string): Promise<string> {
  const first = await getBlogImage(topic, context);
  if (await imageLoads(first, 60_000)) return first;
  const retry = first.includes('image.pollinations.ai')
    ? first.replace(/seed=(\d+)/, (_, s) => `seed=${(Number(s) + 7919) % 100000}`)
    : fallbackImage(topic, Date.now() % 100000, context);
  if (await imageLoads(retry, 60_000)) return retry;
  throw new Error('Featured image unavailable — retry generation later');
}

// Strip ALL inline images from blog content.
// Only ONE featured image per blog (on the card) — no images inside content.
export async function replaceContentImages(
  content: string,
  topic: string,
  context?: string
): Promise<string> {
  if (!content) return content;

  // Remove ALL markdown images: ![alt](url)
  let cleaned = content.replace(/!\[[^\]]*\]\([^)]+\)\n?/g, '');

  // Remove ALL HTML img tags: <img ... />
  cleaned = cleaned.replace(/<img[^>]*>\n?/gi, '');

  return cleaned;
}
