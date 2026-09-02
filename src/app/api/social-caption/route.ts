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
    const systemPrompt = `You are a social media caption generator. You MUST return ONE caption object for EVERY platform in the user's list — never skip or merge. Output ONLY valid JSON with NO commentary, no markdown, no code fences. Schema: {"platforms":[{"platform":"name","caption":"text","hooks":["h1","h2","h3"],"hashtags":["#t1","#t2"]}]}. The "platforms" array length must equal the number of platforms requested.`;

    const userPrompt = `You are given ${frames.length > 0 ? (frames.length > 1 ? `${frames.length} video frames` : 'an image') : 'no image'}. Your captions MUST be based PRIMARILY on what you actually SEE in the ${frames.length > 1 ? 'frames' : 'image'} (people, objects, scene, mood, colors, setting, action, text, product, food, etc.) — NOT on the user's text hint.
${topic || videoDescription ? `\nUser's optional hint (use as tone/angle only, not as the main subject): "${topic || videoDescription}"\n` : ''}Tone: ${tone || 'engaging'}
Language: ${languageKey}
Platforms (return ALL ${finalPlatforms.length}): ${finalPlatforms.join(', ')}

CRITICAL RULES:
1. First, DESCRIBE the image in your head (what's actually in it — a person holding a coffee cup? a sunset? a product on a table? text on a screen?).
2. Then write captions ABOUT that visual content.
3. Return exactly ${finalPlatforms.length} platform entries in the same order, one per platform. Do not stop early.
4. For each: hook (1 line) + value (2 lines) + CTA (1 line) + 5-8 hashtags.
5. Output JSON only, no commentary.`;

    // SINGLE FAST CALL: Use Groq with vision if image/video frames provided, otherwise text-only
    let raw: string = '';
    let imageAnalysis = '';
    let visionFailed = false;

    if (frames.length > 0) {
      // PRIMARY: Use Groq vision (4 keys rotation for reliability)
      try {
        const keys = (process.env.GROQ_API_KEYS || '').split(',').map(s => s.trim()).filter(Boolean);
        let lastError = '';
        let success = false;
        
        // Try each Groq key with rotation
        for (let attempt = 0; attempt < keys.length && !success; attempt++) {
          const key = keys[attempt];
          try {
            const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
              { type: 'text', text: userPrompt + (frames.length > 1 ? '\n\nNOTE: Multiple video frames provided.' : '') }
            ];
            
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
                model: 'qwen/qwen3.6-27b',
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: userContent }
                ],
                max_tokens: 4096,
                response_format: { type: 'json_object' },
              }),
              signal: AbortSignal.timeout(20000),
            });

            if (res.ok) {
              const data = await res.json();
              raw = data.choices?.[0]?.message?.content || '';
              if (raw) {
                success = true;
                imageAnalysis = frames.length > 1 ? `${frames.length} video frames analyzed (Groq)` : 'Image analyzed (Groq)';
              } else {
                lastError = 'Empty response';
              }
            } else {
              const errText = await res.text().catch(() => '');
              lastError = `Groq ${res.status}: ${errText.slice(0, 100)}`;
              console.warn(`[social-caption] Key ${key.slice(0, 12)}... failed:`, lastError);
              if (res.status === 429) continue; // Rate limited, try next key
            }
          } catch (err) {
            lastError = err instanceof Error ? err.message : String(err);
            console.warn(`[social-caption] Key ${key.slice(0, 12)}... error:`, lastError);
          }
        }
        
        if (!success) {
          throw new Error(lastError || 'All Groq keys failed');
        }
      } catch (e) {
        console.warn('[social-caption] Groq vision failed, trying text-only fallback:', e instanceof Error ? e.message : e);
        visionFailed = true;

        // FALLBACK 1: text-only with the user's topic (no image needed).
        // Works around Groq 413 ("image too large") and Pollinations outages.
        try {
          raw = await generateAIText(systemPrompt, userPrompt, { json: true, timeoutMs: 20000 });
          imageAnalysis = 'Text-only generation (image skipped)';
          console.log('[social-caption] Text-only fallback succeeded');
        } catch (textErr) {
          console.warn('[social-caption] Text-only failed, trying Pollinations:', textErr);

          // FALLBACK 2: Pollinations (free, no API key)
          try {
            const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
            const pollUrl = `https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}?model=openai&json=true`;
            const pollRes = await fetch(pollUrl, {
              signal: AbortSignal.timeout(20000),
            });

            if (pollRes.ok) {
              const pollText = await pollRes.text();
              raw = pollText;
              imageAnalysis = 'Generated (Pollinations)';
              console.log('[social-caption] Pollinations fallback succeeded');
            } else {
              throw new Error(`Pollinations ${pollRes.status}`);
            }
          } catch (pollErr) {
            console.error('[social-caption] All methods failed:', pollErr);
            throw new Error('Caption generation failed. Please try again in 10 seconds.');
          }
        }
      }
    } else {
      // No image - text-only generation (super fast with Groq)
      try {
        raw = await generateAIText(systemPrompt, userPrompt, { json: true, timeoutMs: 20000 });
      } catch (e) {
        console.warn('[social-caption] Groq text failed, trying Pollinations:', e);
        
        // Fallback to Pollinations simple GET
        try {
          const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
          const pollUrl = `https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}?model=openai&json=true`;
          const pollRes = await fetch(pollUrl, {
            signal: AbortSignal.timeout(20000),
          });
          
          if (pollRes.ok) {
            const pollText = await pollRes.text();
            raw = pollText;
            console.log('[social-caption] Pollinations text fallback succeeded');
          } else {
            throw new Error(`Pollinations ${pollRes.status}`);
          }
        } catch (pollErr) {
          console.error('[social-caption] All text methods failed:', pollErr);
          throw new Error('Caption generation failed. Please try again in 10 seconds.');
        }
      }
    }

    const result = parseJsonLoose(raw);
    if (!result || !Array.isArray(result.platforms)) {
      console.error('[social-caption] Failed to parse AI response. Raw output:', raw?.slice(0, 500));
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
