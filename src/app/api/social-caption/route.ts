import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

// AI Social Media Caption Generator - generates platform-optimized captions, hooks & hashtags using Pollinations.ai (100% free)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { topic, videoDescription, tone, platforms } = await req.json();
    if (!topic && !videoDescription) return NextResponse.json({ error: 'Topic or video description is required' }, { status: 400 });

    const selectedPlatforms = platforms || ['instagram', 'tiktok', 'youtube', 'linkedin', 'twitter', 'facebook'];

    const platformSpecs: Record<string, string> = {
      instagram: 'Instagram: Max 2,200 chars. Use emojis, line breaks, engaging hook in first line. 15-30 hashtags. Include CTA. Casual and visual tone.',
      tiktok: 'TikTok: Max 300 chars. Short, punchy, trend-aware. 3-5 hashtags max. Use slang and casual language. Hook in first 3 words.',
      youtube: 'YouTube Shorts: Max 5,000 chars. SEO-optimized title + description. Include keywords naturally. 3-5 hashtags. Professional yet engaging.',
      linkedin: 'LinkedIn: Max 3,000 chars. Professional tone. Thought leadership angle. Include industry insights. 3-5 hashtags. Strong opening hook.',
      twitter: 'X (Twitter): Max 280 chars. Ultra concise. Witty or bold. 1-2 hashtags max. Include a question or hot take. High engagement focus.',
      facebook: 'Facebook: Max 63,206 chars. Conversational and community-focused. Include a question to drive comments. 2-3 hashtags. Storytelling approach.',
    };

    const platformList = selectedPlatforms.map((p: string) => platformSpecs[p] || `${p}: Standard social media caption.`).join('\n');

    const systemPrompt = `You are an expert social media content strategist and viral caption writer. You create platform-optimized captions, attention-grabbing hooks, and strategic hashtags that maximize engagement, reach, and virality.

Rules:
- Write in ${tone || 'engaging'} tone
- Optimize each caption for its specific platform's algorithm and audience behavior
- Create 3 different hook options for each platform (first line that stops the scroll)
- Write a full caption body with natural flow and strong CTA
- Generate 15-30 relevant hashtags for Instagram, 3-5 for other platforms
- Include platform-specific formatting (emojis for IG, professional for LinkedIn, etc.)
- Make captions feel native to each platform (not copy-pasted)
- Use trending hashtag strategies and niche-specific tags
- Include engagement-driving elements (questions, polls, CTAs)

You must respond in this exact JSON format (no other text):
{
  "platforms": [
    {
      "platform": "instagram",
      "caption": "Full caption text...",
      "hooks": ["Hook option 1", "Hook option 2", "Hook option 3"],
      "hashtags": ["#hashtag1", "#hashtag2", "..."],
      "characterCount": 0
    }
  ],
  "generalTips": ["Tip 1", "Tip 2", "Tip 3", "Tip 4"]
}`;

    const userPrompt = `Create viral, platform-optimized social media captions for this content:

Topic: "${topic || 'N/A'}"
${videoDescription ? `Video Description: "${videoDescription}"` : ''}
Tone: ${tone || 'engaging'}

Generate captions for these platforms:
${platformList}

For each platform:
1. Write 3 different scroll-stopping hooks (first lines)
2. Write a full optimized caption with CTA
3. Generate strategic hashtags (mix of trending, niche, and broad)
4. Calculate exact character count

Also provide 4 general pro tips for maximizing reach across all platforms.`;

    // Generate via Pollinations (free)
    const pollinationsRes = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    let result;
    if (pollinationsRes.ok) {
      const text = await pollinationsRes.text();
      try {
        result = JSON.parse(text);
      } catch {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not parse AI response');
        }
      }
    } else {
      throw new Error('AI generation failed');
    }

    // Validate and structure response
    if (!result.platforms || !Array.isArray(result.platforms)) {
      throw new Error('Invalid AI response format');
    }

    // Ensure character counts are calculated
    result.platforms = result.platforms.map((p: { caption: string; hooks: string[]; hashtags: string[]; characterCount?: number }) => ({
      ...p,
      characterCount: p.characterCount || `${p.hooks?.[0] || ''}\n\n${p.caption}\n\n${(p.hashtags || []).join(' ')}`.length,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Social caption generation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate captions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
