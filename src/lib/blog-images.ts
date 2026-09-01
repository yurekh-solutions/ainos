// Featured-image provider for AINOS blogs.
// Primary: Pexels real photos (PEXELS_API_KEY) — premium, contextual imagery.
// Secondary: Unsplash (UNSPLASH_ACCESS_KEY).
// Fallback: Pollinations.ai generated image (always available, no key needed).

const fallbackImage = (topic: string, seed: number) =>
  `https://image.pollinations.ai/prompt/${encodeURIComponent(
    `Professional blog header image about ${topic}, modern business concept, clean design, high quality, 16:9`
  )}?width=1200&height=630&nologo=true&seed=${seed}`;

export async function getBlogImage(topic: string): Promise<string> {
  const query = topic.split(/\s+/).slice(0, 6).join(' ') || 'business';
  const seed = Date.now() % 100000;

  // 1) Pexels — real high-quality photos
  if (process.env.PEXELS_API_KEY) {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
        { headers: { Authorization: process.env.PEXELS_API_KEY } }
      );
      if (res.ok) {
        const data: { photos?: Array<{ src?: { large?: string; landscape?: string } }> } = await res.json();
        const photos = data.photos || [];
        if (photos.length) {
          const pick = photos[seed % photos.length];
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
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }
      );
      if (res.ok) {
        const data: { results?: Array<{ urls?: { regular?: string } }> } = await res.json();
        const results = data.results || [];
        if (results.length) {
          const pick = results[seed % results.length];
          const url = pick.urls?.regular;
          if (url) return url;
        }
      }
    } catch { /* fall through to next provider */ }
  }

  // 3) Pollinations generated image (no key required)
  return fallbackImage(topic, seed);
}
