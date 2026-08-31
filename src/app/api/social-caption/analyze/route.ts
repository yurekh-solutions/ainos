import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { analyzeMedia } from '@/lib/ai-provider';

// AI Media Scanner — auto-fills topic + description from an uploaded image or video frame
// Gemini (GEMINI_API_KEY) primary + Pollinations vision fallback via ai-provider
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { imageBase64, mediaType } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: 'Media is required' }, { status: 400 });
    }

    const isVideo = mediaType === 'video';
    const label = isVideo ? 'video reel frame' : 'image';

    const instruction = `You are analyzing a ${label} that a creator wants to post on social media.

Look at it carefully and return ONLY this JSON (no markdown, no extra text):
{
  "topic": "A short 4-8 word content topic/title describing what this post is about",
  "description": "2-3 sentences describing exactly what is visible: subjects, actions, setting, mood, colors, style${isVideo ? ', and what likely happens in the reel' : ''}",
  "niche": "The industry/niche this belongs to (e.g. Fitness, Food, Fashion, Tech, Travel, Real Estate)",
  "detectedObjects": ["object1", "object2", "object3"],
  "mood": "The overall mood/emotion in one or two words"
}

Rules:
- topic must read like a real content title a creator would type, not a description
- be specific about what you actually see, never generic
- if text is visible in the media, factor it into the topic`;

    const analysis = await analyzeMedia(imageBase64, instruction);
    if (!analysis) {
      // No vision backend reachable (Pollinations anonymous vision is gated with 402).
      // Degrade gracefully — the user can still type topic/description manually.
      return NextResponse.json({ error: 'AI scan is unavailable right now — please fill the topic and description manually' }, { status: 503 });
    }

    let result: Record<string, unknown>;
    try {
      result = JSON.parse(analysis);
    } catch {
      const stripped = analysis.replace(/```(?:json)?/gi, '');
      const jsonMatch = stripped.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[0]);
        } catch {
          result = { topic: '', description: stripped.slice(0, 500) };
        }
      } else {
        // Fall back to using the raw description text
        result = { topic: '', description: stripped.slice(0, 500) };
      }
    }

    return NextResponse.json({
      topic: typeof result.topic === 'string' ? result.topic : '',
      description: typeof result.description === 'string' ? result.description : '',
      niche: typeof result.niche === 'string' ? result.niche : '',
      mood: typeof result.mood === 'string' ? result.mood : '',
      detectedObjects: Array.isArray(result.detectedObjects) ? result.detectedObjects : [],
    });
  } catch (error) {
    console.error('Media analyze error:', error);
    const message = error instanceof Error ? error.message : 'Failed to analyze media';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
