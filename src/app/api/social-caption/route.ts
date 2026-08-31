import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { analyzeMedia, generateAIText } from '@/lib/ai-provider';

// AI Social Media Caption Generator with Image/Video Analysis
// Gemini (GEMINI_API_KEY) primary + Pollinations.ai fallback via ai-provider.

type KnownPlatform = 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'twitter' | 'facebook';

const ALL_PLATFORMS: KnownPlatform[] = ['instagram', 'tiktok', 'youtube', 'linkedin', 'twitter', 'facebook'];

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  english: 'Write all hooks and captions in English.',
  hinglish: 'Write all hooks and captions in natural Hinglish (Roman-script Hindi + English mix, like urban Indian creators speak). Keep hashtags in English for maximum reach.',
  hindi: 'Write all hooks and captions in Hindi (Devanagari script). Keep hashtags in English for maximum reach.',
};

// Map whatever platform name the AI returns to our internal keys
function normalizePlatformKey(raw: unknown): KnownPlatform | null {
  const s = String(raw ?? '').toLowerCase().replace(/[^a-z]/g, '');
  if (!s) return null;
  if (s.includes('instagram') || s === 'ig') return 'instagram';
  if (s.includes('tiktok')) return 'tiktok';
  if (s.includes('youtube') || s.includes('shorts')) return 'youtube';
  if (s.includes('linkedin')) return 'linkedin';
  if (s.includes('twitter') || s === 'x') return 'twitter';
  if (s.includes('facebook') || s === 'fb') return 'facebook';
  return null;
}

function cleanHashtags(raw: unknown, limit: number): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of raw) {
    const cleaned = String(tag).trim().replace(/\s+/g, '').replace(/,+$/, '');
    if (!cleaned) continue;
    const withHash = cleaned.startsWith('#') ? cleaned : `#${cleaned}`;
    if (withHash.length < 2 || withHash.length > 50) continue;
    const key = withHash.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(withHash);
    if (out.length >= limit) break;
  }
  return out;
}

// Loosely extract a JSON object from an AI reply (handles code fences, prose around JSON)
function parseJsonLoose(text: string): Record<string, unknown> | null {
  if (!text) return null;
  const stripped = text.replace(/```(?:json)?/gi, '').trim();
  try {
    return JSON.parse(stripped) as Record<string, unknown>;
  } catch {
    /* fall through */
  }
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(stripped.slice(start, end + 1)) as Record<string, unknown>;
    } catch {
      /* fall through */
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { topic, videoDescription, tone, platforms, imageBase64, language } = await req.json();
    if (!topic && !videoDescription && !imageBase64) {
      return NextResponse.json({ error: 'Topic, description, or media upload is required' }, { status: 400 });
    }

    // Guard against an empty platform selection silently meaning "no platforms"
    const selectedPlatforms: KnownPlatform[] = Array.isArray(platforms) && platforms.length > 0
      ? platforms.map(normalizePlatformKey).filter((p): p is KnownPlatform => p !== null)
      : ALL_PLATFORMS;
    const finalPlatforms = selectedPlatforms.length > 0 ? selectedPlatforms : ALL_PLATFORMS;
    const languageKey = typeof language === 'string' && LANGUAGE_INSTRUCTIONS[language] ? language : 'english';

    const platformSpecs: Record<KnownPlatform, string> = {
      instagram: 'Instagram: Max 2,200 chars. Use emojis, line breaks, engaging hook in first line. 15-30 hashtags. Include CTA. Casual and visual tone.',
      tiktok: 'TikTok: Max 300 chars. Short, punchy, trend-aware. 3-5 hashtags max. Use slang and casual language. Hook in first 3 words.',
      youtube: 'YouTube Shorts: Max 5,000 chars. SEO-optimized title + description. Include keywords naturally. 3-5 hashtags. Professional yet engaging.',
      linkedin: 'LinkedIn: Max 3,000 chars. Professional tone. Thought leadership angle. Include industry insights. 3-5 hashtags. Strong opening hook.',
      twitter: 'X (Twitter): Max 280 chars. Ultra concise. Witty or bold. 1-2 hashtags max. Include a question or hot take. High engagement focus.',
      facebook: 'Facebook: Max 63,206 chars. Conversational and community-focused. Include a question to drive comments. 2-3 hashtags. Storytelling approach.',
    };

    const platformList = finalPlatforms.map((p) => platformSpecs[p]).join('\n');

    // Step 1 (best-effort): If image/video frame uploaded, analyze it with AI vision
    let imageAnalysis = '';
    let visionFailed = false;
    if (imageBase64) {
      const analysis = await analyzeMedia(
        imageBase64,
        'Analyze this image/video thumbnail in detail. Describe: 1) What objects/people are visible 2) The mood/emotion 3) The setting/location 4) Colors and style 5) What action or story is being told 6) What niche/industry this belongs to. Be specific and detailed. This will be used to write viral social media captions.'
      );
      if (analysis) {
        imageAnalysis = analysis;
      } else {
        visionFailed = true;
      }
    }

    // Step 2: Generate platform-specific captions
    const languageInstruction = LANGUAGE_INSTRUCTIONS[languageKey];
    const systemPrompt = `You are an expert social media content strategist and viral caption writer. You create platform-optimized captions, attention-grabbing hooks, and strategic hashtags that maximize engagement, reach, and virality for GLOBAL audiences.

Rules:
- Write in ${tone || 'engaging'} tone
- ${languageInstruction}
- Optimize each caption for its specific platform's algorithm and audience behavior
- Create 3 different hook options for each platform (first line that stops the scroll)
- Write a full caption body with natural flow and strong CTA
- Generate 15-30 relevant hashtags for Instagram, 3-5 for other platforms
- Include platform-specific formatting (emojis for IG, professional for LinkedIn, etc.)
- Make captions feel native to each platform (not copy-pasted)
- Use trending hashtag strategies and niche-specific tags
- Include engagement-driving elements (questions, polls, CTAs)
- Include GLOBAL trending hashtags that work across USA, UK, India, UAE, Europe, Australia
- Mix broad viral hashtags (#viral, #trending, #fyp) with niche-specific ones
- Add location-diverse hashtags for maximum global reach

You must respond with ONLY valid JSON in this exact format (no markdown, no code fences, no other text):
{
  "platforms": [
    {
      "platform": "instagram",
      "caption": "Full caption text...",
      "hooks": ["Hook option 1", "Hook option 2", "Hook option 3"],
      "hashtags": ["#hashtag1", "#hashtag2"]
    }
  ],
  "generalTips": ["Tip 1", "Tip 2", "Tip 3", "Tip 4"]
}`;

    const userPrompt = `Create viral, platform-optimized social media captions for this content:

${topic ? `Topic: "${topic}"` : ''}
${videoDescription ? `Content Description: "${videoDescription}"` : ''}
${imageAnalysis ? `AI Vision Analysis of uploaded media: "${imageAnalysis}"` : ''}
${!topic && !videoDescription && imageAnalysis ? 'NOTE: The user has only uploaded an image/video. Use the AI Vision Analysis above as the PRIMARY source to generate accurate, relevant captions and hashtags. Do not ask for more context.' : ''}
Tone: ${tone || 'engaging'}
Caption language: ${languageKey}

Generate captions for EXACTLY these platforms (use these exact platform keys in the JSON):
${platformList}

For each platform:
1. Write 3 different scroll-stopping hooks (first lines)
2. Write a full optimized caption with CTA
3. Generate strategic hashtags including:
   - 3-5 broad viral hashtags (#viral, #trending, #fyp, #explore)
   - 5-10 niche-specific hashtags based on the content
   - 3-5 global reach hashtags (#global, #worldwide, #international)
   - Platform-specific trending hashtags

${!topic && !videoDescription && !imageAnalysis ? 'No text context was given, so create broadly appealing captions based on the topic field alone.' : ''}`;

    const raw = await generateAIText(systemPrompt, userPrompt, { json: true });
    const result = parseJsonLoose(raw);
    if (!result || !Array.isArray(result.platforms)) {
      throw new Error('Could not understand the AI response — please regenerate');
    }

    // Normalize: known platform keys, sanitize fields, dedupe, exact char counts
    const seen = new Set<KnownPlatform>();
    const sanitized = (result.platforms as Array<Record<string, unknown>>)
      .map((p) => {
        const key = normalizePlatformKey(p.platform);
        if (!key || seen.has(key)) return null;
        seen.add(key);
        const hooks = Array.isArray(p.hooks)
          ? p.hooks.map((h) => String(h ?? '').trim()).filter(Boolean).slice(0, 3)
          : [];
        const caption = String(p.caption ?? '').trim();
        const hashtags = cleanHashtags(p.hashtags, key === 'instagram' ? 30 : 10);
        const prefix = hooks[0] ? `${hooks[0]}\n\n` : '';
        const suffix = hashtags.length ? `\n\n${hashtags.join(' ')}` : '';
        const fullLength = `${prefix}${caption}${suffix}`.length;
        return { platform: key, caption, hooks, hashtags, characterCount: fullLength };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    if (sanitized.length === 0) {
      throw new Error('The AI returned no usable captions — please regenerate');
    }

    const generalTips = Array.isArray(result.generalTips)
      ? result.generalTips.map((t) => String(t ?? '').trim()).filter(Boolean).slice(0, 6)
      : [];

    return NextResponse.json({
      topic: topic || '',
      language: languageKey,
      imageAnalysis: imageAnalysis || undefined,
      visionFailed: imageBase64 ? visionFailed : undefined,
      platforms: sanitized,
      generalTips,
    });
  } catch (error) {
    console.error('Social caption generation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate captions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
