// Featured-image provider for AINOS blogs.
// Primary: Pexels real photos (PEXELS_API_KEY) — premium, contextual imagery.
// Secondary: Unsplash (UNSPLASH_ACCESS_KEY).
// Fallback: Pollinations.ai AI-generated image (flux-realism model, Full HD).

const fallbackImage = (topic: string, seed: number) => {
  const prompt = [
    `Professional blog header image about ${topic}`,
    'modern editorial photography, shallow depth of field',
    'cinematic natural lighting, warm tones',
    'clean composition, rule of thirds',
    'high detail, sharp focus, 8K quality',
    'no text, no watermarks, no logos',
  ].join(', ');
  const params = new URLSearchParams({
    width: '1920',
    height: '1080',
    model: 'flux-realism',
    enhance: 'true',
    nologo: 'true',
    seed: String(seed),
    negative: 'blurry, low quality, distorted, watermark, text, logo, ugly, deformed, oversaturated',
  });
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params.toString()}`;
};

// Words that add no visual meaning — dropped so image search hits the real subject
const STOPWORDS = new Set(['the','a','an','and','or','but','if','for','nor','on','in','of','to','from','by','at','with','about','into','over','after','before','between','under','during','through','how','what','when','where','why','which','who','whom','this','that','these','those','is','are','was','were','be','been','being','do','does','did','will','would','shall','should','may','might','must','can','could','vs','via','your','you','their','they','our','we','my','it','its','as','per','out','up','down','off','again','more','most','best','top','guide','checklist','complete','ultimate','essential','ways','tips']);

// Abstract / non-visual words that produce irrelevant stock photos
const ABSTRACT_WORDS = new Set(['guide','plan','action','strategy','strategies','steps','tips','checklist','complete','ultimate','essential','measure','success','kpi','kpis','metrics','results','zero','build','building','first','regulations','regulation','compliance','must','know','impact','impacts','customer','experience','loyalty','budget','smart','compromise','quality','actually','matter','terms','glossary','client','should','every','psychology','behind','decisions','directly','flawless','events','celebrations','step','day','flawless','what','every','business','latest','trends','expert','cost','saving','discover','execute','corporate','grand','practical','insights','actionable','behind','smart','decisions']);

export async function getBlogImage(topic: string, context?: string): Promise<string> {
  // Strategy: niche-first query, then only concrete visual keywords from topic
  // This avoids abstract words like "budget", "measure", "glossary" that return
  // irrelevant stock photos (wallets, code, laptops instead of AV equipment)
  const allWords = topic
    .split(/[^a-zA-Z0-9]+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w.toLowerCase()) && !ABSTRACT_WORDS.has(w.toLowerCase()));

  // Build query: niche (context) is the PRIMARY search term
  // Add at most 2 concrete visual keywords from the topic for specificity
  const nicheQuery = (context || '').trim();
  const topicKeywords = allWords.slice(0, 2).join(' ');
  const query = nicheQuery
    ? `${nicheQuery}${topicKeywords ? ' ' + topicKeywords : ''}`
    : (allWords.slice(0, 3).join(' ') || 'business');
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
        { headers: { Authorization: process.env.PEXELS_API_KEY } }
      );
      if (res.ok) {
        const data: { photos?: Array<{ src?: { large?: string; landscape?: string } }> } = await res.json();
        const photos = data.photos || [];
        if (photos.length) {
          const pick = photos[hash % photos.length];
          const url = pick.src?.large || pick.src?.landscape;
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
        { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }
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
  return fallbackImage(topic, seed);
}

// Strip ALL AI-generated images and insert SECTION-SPECIFIC images.
// Each H2 section gets its own image based on that section's actual content.
// Pexels/Unsplash inline images are unreliable — Pollinations AI with
// detailed section-aware prompts gives consistent, relevant results.
export async function replaceContentImages(
  content: string,
  topic: string,
  context?: string
): Promise<string> {
  if (!content) return content;

  // Step 1: Remove ALL existing markdown images (AI inserts random URLs)
  let cleaned = content.replace(/!\[[^\]]*\]\([^)]+\)\n?/g, '');

  // Step 2: Extract topic keywords for image prompts
  const allWords = topic
    .split(/[^a-zA-Z0-9]+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w.toLowerCase()) && !ABSTRACT_WORDS.has(w.toLowerCase()));
  const nicheQuery = (context || '').trim();
  const topicKeywords = allWords.slice(0, 3).join(' ');
  const baseTopic = nicheQuery
    ? `${nicheQuery} ${topicKeywords}`.trim()
    : (topicKeywords || topic);

  // Step 3: Split content into H2 sections and generate image per section
  const h2Regex = /^## (.+)$/gm;
  const sections: Array<{ heading: string; body: string; startIdx: number; endIdx: number }> = [];
  let h2Match: RegExpExecArray | null;

  while ((h2Match = h2Regex.exec(cleaned)) !== null) {
    const startIdx = h2Match.index;
    const heading = h2Match[1].trim();
    // Find next H2 or end of content
    const nextH2 = cleaned.indexOf('\n## ', startIdx + 1);
    const endIdx = nextH2 === -1 ? cleaned.length : nextH2;
    const body = cleaned.slice(startIdx + h2Match[0].length, endIdx).trim();
    sections.push({ heading, body, startIdx, endIdx });
  }

  // If no H2 sections found, insert one image after first heading
  if (sections.length === 0) {
    const anyHeading = cleaned.match(/^#+ .+$/m);
    if (anyHeading) {
      const idx = cleaned.indexOf(anyHeading[0]);
      const afterHeading = idx + anyHeading[0].length;
      const img = buildSectionImage(baseTopic, anyHeading[0].replace(/^#+ /, ''), '', 0);
      cleaned = cleaned.slice(0, afterHeading) + `\n\n${img}\n\n` + cleaned.slice(afterHeading);
    }
    return cleaned;
  }

  // Step 4: For each H2 section, generate a section-specific image
  // Process in reverse to preserve string indices
  for (let i = sections.length - 1; i >= 0; i--) {
    const section = sections[i];

    // Extract keywords from section body for a specific prompt
    const bodyWords = section.body
      .replace(/[#*`\[\]()]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !STOPWORDS.has(w.toLowerCase()) && !ABSTRACT_WORDS.has(w.toLowerCase()));

    // Take first 4 meaningful words from body as image context
    const bodyKeywords = bodyWords.slice(0, 4).join(' ');

    // Build section-specific image
    const img = buildSectionImage(baseTopic, section.heading, bodyKeywords, i);

    // Insert image after the H2 heading line
    const headingEnd = section.startIdx + `## ${section.heading}`.length;
    cleaned = cleaned.slice(0, headingEnd) + `\n\n${img}\n\n` + cleaned.slice(headingEnd);
  }

  return cleaned;
}

// Build a Pollinations image URL with a detailed section-specific prompt
function buildSectionImage(baseTopic: string, heading: string, bodyKeywords: string, index: number): string {
  // Combine topic + heading + body keywords for a specific prompt
  const specificContext = bodyKeywords
    ? `${baseTopic} ${heading} ${bodyKeywords}`
    : `${baseTopic} ${heading}`;

  const prompt = [
    `Professional photograph illustrating ${specificContext}`,
    'modern commercial or industrial setting',
    'clean composition, natural lighting, sharp focus',
    'high detail, professional quality',
    'no people faces, no text overlays, no watermarks',
  ].join(', ');

  const params = new URLSearchParams({
    width: '1200',
    height: '630',
    model: 'flux-realism',
    enhance: 'true',
    nologo: 'true',
    seed: String((index * 7919 + 42) % 100000),
    negative: 'blurry, low quality, distorted, watermark, text, logo, ugly, deformed, oversaturated, people, faces, portrait, selfie, ocean, sea, beach, forest, nature landscape, food, cooking, animals',
  });

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params.toString()}`;
  const alt = heading.replace(/[^a-zA-Z0-9 ]/g, '').trim();
  return `![${alt}](${url})`;
}
