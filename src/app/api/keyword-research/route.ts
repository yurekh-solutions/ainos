import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { generateAIText } from '@/lib/ai-provider';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { topic, industry, count } = await req.json();
    if (!topic) return NextResponse.json({ error: 'Topic is required' }, { status: 400 });

    const keywordCount = count || 20;

    const systemPrompt = `You are an SEO keyword research expert. Generate highly relevant, searchable keywords for blog content that rank well on Google and drive organic traffic.

Rules:
- Generate ${keywordCount} keyword suggestions
- Include primary keywords (high volume)
- Include long-tail keywords (lower competition, higher conversion)
- Include question-based keywords (for voice search and AEO)
- Include LSI (Latent Semantic Indexing) keywords
- Keywords should be relevant to the topic and industry
- Mix of head terms and specific phrases
- Consider search intent (informational, commercial, transactional)

You must respond in this exact JSON format (no other text):
{
  "primaryKeywords": ["keyword 1", "keyword 2", "keyword 3"],
  "longTailKeywords": ["long tail keyword 1", "long tail keyword 2", "long tail keyword 3"],
  "questionKeywords": ["how to...", "what is...", "why..."],
  "lsiKeywords": ["related term 1", "related term 2"],
  "searchVolume": { "keyword 1": "high", "keyword 2": "medium" },
  "competition": { "keyword 1": "low", "keyword 2": "medium" },
  "contentIdeas": ["Blog post idea 1", "Blog post idea 2"]
}`;

    const userPrompt = `Generate SEO keywords for the topic: "${topic}"
${industry ? `Industry: ${industry}` : ''}

Include:
- 3-5 primary keywords (high search volume)
- 5-7 long-tail keywords (specific phrases, lower competition)
- 3-5 question-based keywords (for FAQ and voice search)
- 3-5 LSI keywords (semantically related terms)
- Search volume estimates (high/medium/low)
- Competition level (low/medium/high)
- 3-5 content ideas based on these keywords`;

    const aiRaw = await generateAIText(systemPrompt, userPrompt, { json: true });
    
    let result;
    try {
      result = JSON.parse(aiRaw);
    } catch {
      const jsonMatch = aiRaw.replace(/```(?:json)?/gi, '').match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error researching keywords:', error);
    return NextResponse.json({ error: 'Failed to research keywords' }, { status: 500 });
  }
}
