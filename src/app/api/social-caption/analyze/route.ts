import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

// AI Media Scanner — auto-fills topic + description from an uploaded image or video frame
// Uses Pollinations.ai vision (100% free, no API key)
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

    const visionRes = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: instruction },
              { type: 'image_url', image_url: { url: imageBase64 } },
            ],
          },
        ],
      }),
    });

    if (!visionRes.ok) {
      throw new Error('Vision analysis failed');
    }

    const raw = await visionRes.text();
    let content = raw;
    try {
      const parsed = JSON.parse(raw);
      content = parsed.choices?.[0]?.message?.content || raw;
    } catch {
      content = raw;
    }

    let result: Record<string, unknown>;
    try {
      result = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        // Fall back to using the raw description text
        result = { topic: '', description: content.slice(0, 500) };
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
