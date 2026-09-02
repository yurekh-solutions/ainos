import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { generateAIText } from '@/lib/ai-provider';

// AI Content Optimization - Real-time SEO score and suggestions
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, content, keywords, category } = await req.json();
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const wordCount = content.split(/\s+/).length;

    const systemPrompt = `You are an SEO content optimization expert. Analyze the blog post and provide actionable recommendations to improve its search engine ranking and readability.

Analyze these aspects:
1. **SEO Score** (0-100): Overall optimization level
2. **Title Optimization**: Length, keyword placement, engagement
3. **Content Quality**: Depth, readability, structure
4. **Keyword Optimization**: Density, placement, LSI keywords
5. **Readability**: Sentence length, paragraph structure, headings
6. **Engagement**: Hook, CTA, formatting
7. **Technical SEO**: Meta description, headings hierarchy, internal links

Provide specific, actionable recommendations (not generic advice).

You must respond in this exact JSON format (no other text):
{
  "overallScore": 75,
  "title": {
    "score": 80,
    "feedback": "Title is good but could be more compelling",
    "suggestions": ["Add power word like 'Ultimate' or 'Complete'", "Include primary keyword near the beginning"]
  },
  "content": {
    "score": 70,
    "wordCount": 1200,
    "feedback": "Content is comprehensive but needs better structure",
    "suggestions": ["Add more H2/H3 subheadings", "Break up long paragraphs", "Include bullet points for key takeaways"]
  },
  "keywords": {
    "score": 65,
    "primaryKeyword": "keyword",
    "density": 1.5,
    "feedback": "Keyword density is slightly low",
    "suggestions": ["Increase primary keyword usage in first 100 words", "Add LSI keywords: related1, related2", "Include keyword in at least one H2"]
  },
  "readability": {
    "score": 75,
    "gradeLevel": 8,
    "feedback": "Readability is good for general audience",
    "suggestions": ["Shorten sentences over 25 words", "Use more transition words", "Add more white space"]
  },
  "engagement": {
    "score": 60,
    "feedback": "Hook needs improvement",
    "suggestions": ["Start with a question or surprising stat", "Add more storytelling elements", "Strengthen CTA at the end"]
  },
  "technical": {
    "score": 70,
    "feedback": "Meta description missing",
    "suggestions": ["Add meta description (150-160 chars)", "Ensure H1 > H2 > H3 hierarchy", "Add internal links to related content"]
  },
  "recommendations": [
    "Priority 1: Add meta description with primary keyword",
    "Priority 2: Break up paragraphs longer than 4 lines",
    "Priority 3: Add 2-3 internal links to related posts"
  ],
  "metaDescription": "Suggested meta description (150-160 chars with primary keyword)",
  "slug": "suggested-url-slug"
}`;

    const userPrompt = `Analyze this blog post for SEO optimization:

Title: ${title}
${keywords ? `Target Keywords: ${keywords}` : ''}
${category ? `Category: ${category}` : ''}
Word Count: ${wordCount}

Content:
${content.substring(0, 4000)}

Provide specific, actionable recommendations to improve SEO score from current level to 90+.`;

    const aiRaw = await generateAIText(systemPrompt, userPrompt, { json: true });
    
    let result;
    try {
      result = JSON.parse(aiRaw);
    } catch {
      const jsonMatch = aiRaw.replace(/```(?:json)?/gi, '').match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: basic analysis
        result = generateBasicAnalysis(title, content, keywords, wordCount);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Content optimization error:', error);
    return NextResponse.json({ error: 'Failed to analyze content' }, { status: 500 });
  }
}

function generateBasicAnalysis(title: string, content: string, keywords: string | null, wordCount: number) {
  const suggestions: string[] = [];
  let score = 50;

  // Title analysis
  if (title.length >= 40 && title.length <= 60) score += 10;
  else suggestions.push('Title should be 40-60 characters');

  // Content length
  if (wordCount >= 1000) score += 15;
  else if (wordCount >= 600) score += 10;
  else suggestions.push('Content should be at least 1000 words for SEO');

  // Headings
  if (content.includes('## ')) score += 10;
  else suggestions.push('Add H2 headings for structure');

  // Keywords
  if (keywords && content.toLowerCase().includes(keywords.toLowerCase().split(',')[0])) {
    score += 10;
  } else {
    suggestions.push('Include primary keyword in content');
  }

  // FAQ
  if (/FAQ|faq|frequently/i.test(content)) {
    score += 5;
  } else {
    suggestions.push('Add FAQ section for AEO (AI citation)');
  }

  // Meta description
  suggestions.push('Add meta description (150-160 characters)');

  return {
    overallScore: Math.min(score, 95),
    title: {
      score: title.length >= 40 && title.length <= 60 ? 85 : 60,
      feedback: title.length >= 40 && title.length <= 60 ? 'Good length' : 'Adjust length to 40-60 characters',
      suggestions: title.length < 40 ? ['Make title more descriptive'] : ['Consider shortening title'],
    },
    content: {
      score: wordCount >= 1000 ? 80 : 60,
      wordCount,
      feedback: wordCount >= 1000 ? 'Good content depth' : 'Content needs more depth',
      suggestions: wordCount < 1000 ? ['Expand content to 1000+ words'] : ['Add more examples and case studies'],
    },
    keywords: {
      score: keywords ? 70 : 50,
      primaryKeyword: keywords?.split(',')[0] || '',
      density: 0,
      feedback: keywords ? 'Keywords present' : 'Add target keywords',
      suggestions: keywords ? ['Increase keyword density to 1-2%'] : ['Define target keywords'],
    },
    readability: {
      score: 70,
      gradeLevel: 8,
      feedback: 'Readability is acceptable',
      suggestions: ['Use shorter sentences', 'Add more transition words'],
    },
    engagement: {
      score: 60,
      feedback: 'Engagement can be improved',
      suggestions: ['Add stronger hook', 'Include more storytelling', 'Strengthen CTA'],
    },
    technical: {
      score: 60,
      feedback: 'Technical SEO needs attention',
      suggestions: ['Add meta description', 'Ensure proper heading hierarchy', 'Add internal links'],
    },
    recommendations: suggestions.slice(0, 5),
    metaDescription: '',
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  };
}
