import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { generateAIText, analyzeMedia } from '@/lib/ai-provider';

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

    // Handle both single image and multiple video frames
    const frames: string[] = Array.isArray(imageBase64) ? imageBase64 : (imageBase64 ? [imageBase64] : []);

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

    // FAST PATH: Single Groq call - vision + captions in one shot (5 seconds!)
    // If image uploaded, use vision model; otherwise use text-only model
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
- If an image/video is provided, analyze it FIRST and base ALL captions on what you see

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
${!topic && !videoDescription && imageBase64 ? 'NOTE: The user has only uploaded an image/video. Analyze it carefully and generate accurate, relevant captions based on what you see. Do not ask for more context.' : ''}
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

${!topic && !videoDescription && !imageBase64 ? 'No text context was given, so create broadly appealing captions based on the topic field alone.' : ''}`;

    // SINGLE FAST CALL: Use Groq with vision if image/video frames provided, otherwise text-only
    let raw: string = '';
    let imageAnalysis = '';
    let visionFailed = false;

    if (frames.length > 0) {
      // Use Groq vision model - analyzes image(s) AND generates captions in ONE call
      try {
        const keys = (process.env.GROQ_API_KEYS || '').split(',').map(s => s.trim()).filter(Boolean);
        
        let lastError = '';
        let success = false;
        
        // Try each Groq key with rotation
        for (let attempt = 0; attempt < keys.length && !success; attempt++) {
          const key = keys[attempt];
          try {
            // Build message content with all frames
            const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
              { type: 'text', text: userPrompt + (frames.length > 1 ? '\n\nNOTE: Multiple frames from a video are provided. Analyze the sequence to understand the full story/action.' : '') }
            ];
            
            // Add all frames (up to 3 for speed)
            frames.slice(0, 3).forEach((frame) => {
              userContent.push({ type: 'image_url', image_url: { url: frame } });
            });

            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`,
              },
              body: JSON.stringify({
                model: 'llama-3.2-90b-vision-preview',
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: userContent }
                ],
                max_tokens: 4096,
                response_format: { type: 'json_object' },
              }),
              signal: AbortSignal.timeout(30000), // 30 second timeout for vision
            });

            if (res.ok) {
              const data = await res.json();
              raw = data.choices?.[0]?.message?.content;
              if (raw) {
                success = true;
                imageAnalysis = frames.length > 1 ? `${frames.length} video frames analyzed` : 'Image analyzed successfully';
              } else {
                lastError = 'Empty response';
              }
            } else {
              const errText = await res.text().catch(() => '');
              lastError = `Groq ${res.status}: ${errText.slice(0, 100)}`;
              console.warn(`[social-caption] Key ${key.slice(0, 12)}... failed:`, lastError);
              
              // If rate limited, try next key
              if (res.status === 429) continue;
            }
          } catch (e) {
            lastError = e instanceof Error ? e.message : String(e);
            console.warn(`[social-caption] Key ${key.slice(0, 12)}... error:`, lastError);
          }
        }
        
        if (!success) {
          throw new Error(lastError || 'All Groq keys failed');
        }
      } catch (e) {
        console.warn('[social-caption] Groq vision failed, using text-only fallback:', e instanceof Error ? e.message : e);
        visionFailed = true;
        
        // Fallback: Try Gemini for vision, then generate captions
        try {
          const analysis = await analyzeMedia(frames[0], 'Describe this image briefly: what objects, people, mood, setting, colors. Under 100 words.');
          imageAnalysis = analysis || '';
          raw = await generateAIText(systemPrompt, userPrompt + (imageAnalysis ? `\n\nAI Vision Analysis: "${imageAnalysis}"` : ''), { json: true, timeoutMs: 30000 });
        } catch (fallbackErr) {
          console.error('[social-caption] All vision methods failed:', fallbackErr);
          throw new Error('AI vision service temporarily unavailable. Please try again in a few seconds.');
        }
      }
    } else {
      // No image - text-only generation (super fast with Groq)
      try {
        raw = await generateAIText(systemPrompt, userPrompt, { json: true, timeoutMs: 30000 });
      } catch (e) {
        console.error('[social-caption] Text generation failed:', e);
        throw new Error('AI service temporarily busy. Please try again in a few seconds.');
      }
    }

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
