import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

// AI Social Media Caption Generator with Image/Video Analysis
// Uses Pollinations.ai for 100% free AI vision + text generation
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { topic, videoDescription, tone, platforms, imageBase64 } = await req.json();
    if (!topic && !videoDescription && !imageBase64) {
      return NextResponse.json({ error: 'Topic, description, or media upload is required' }, { status: 400 });
    }

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

    // Step 1: If image uploaded, analyze it with AI vision first
    let imageAnalysis = '';
    if (imageBase64) {
      try {
        const visionRes = await fetch('https://text.pollinations.ai/openai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'openai',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'Analyze this image/video thumbnail in detail. Describe: 1) What objects/people are visible 2) The mood/emotion 3) The setting/location 4) Colors and style 5) What action or story is being told 6) What niche/industry this belongs to. Be specific and detailed. This will be used to write viral social media captions.'
                  },
                  {
                    type: 'image_url',
                    image_url: { url: imageBase64 }
                  }
                ]
              }
            ]
          })
        });

        if (visionRes.ok) {
          const visionText = await visionRes.text();
          try {
            const visionData = JSON.parse(visionText);
            imageAnalysis = visionData.choices?.[0]?.message?.content || visionText;
          } catch {
            imageAnalysis = visionText;
          }
        }
      } catch (e) {
        console.warn('Vision analysis failed, continuing without it:', e);
      }
    }

    // Step 2: Generate platform-specific captions
    const systemPrompt = `You are an expert social media content strategist and viral caption writer. You create platform-optimized captions, attention-grabbing hooks, and strategic hashtags that maximize engagement, reach, and virality for GLOBAL audiences.

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
- Include GLOBAL trending hashtags that work across USA, UK, India, UAE, Europe, Australia
- Mix broad viral hashtags (#viral, #trending, #fyp) with niche-specific ones
- Add location-diverse hashtags for maximum global reach

You must respond in this exact JSON format (no other text):
{
  "imageAnalysis": "Brief description of what the AI saw in the uploaded media",
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

${topic ? `Topic: "${topic}"` : ''}
${videoDescription ? `Content Description: "${videoDescription}"` : ''}
${imageAnalysis ? `AI Vision Analysis of uploaded media: "${imageAnalysis}"` : ''}
${!topic && !videoDescription && imageAnalysis ? 'NOTE: The user has only uploaded an image/video. Use the AI Vision Analysis above as the PRIMARY source to generate accurate, relevant captions and hashtags. Do not ask for more context.' : ''}
Tone: ${tone || 'engaging'}

Generate captions for these platforms:
${platformList}

For each platform:
1. Write 3 different scroll-stopping hooks (first lines)
2. Write a full optimized caption with CTA
3. Generate strategic hashtags including:
   - 3-5 broad viral hashtags (#viral, #trending, #fyp, #explore)
   - 5-10 niche-specific hashtags based on the content
   - 3-5 global reach hashtags (#global, #worldwide, #international)
   - Platform-specific trending hashtags
4. Calculate exact character count

If only an image/video was uploaded with no text context, rely entirely on the AI Vision Analysis to create relevant, accurate captions.`;

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

    // Add image analysis if available
    if (imageAnalysis) {
      result.imageAnalysis = imageAnalysis;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Social caption generation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate captions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
