import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateAIText } from '@/lib/ai-provider';

// AI Lead Magnet Generator - converts blog into checklist/cheatsheet/template
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { blogId, type } = await req.json();
    if (!blogId) return NextResponse.json({ error: 'Blog ID required' }, { status: 400 });

    const post = await prisma.blogPost.findUnique({ where: { id: blogId } });
    if (!post) return NextResponse.json({ error: 'Blog not found' }, { status: 404 });

    const magnetType = type || 'checklist';
    const content = post.content || '';

    let systemPrompt = '';
    let userPrompt = '';

    switch (magnetType) {
      case 'checklist':
        systemPrompt = 'You are a content strategist. Extract actionable steps from blog content as a checklist.';
        userPrompt = `Convert this blog into a step-by-step checklist (10-15 items). Each item should be actionable and concise.
        
Blog Title: ${post.title}
Content: ${content.substring(0, 3000)}

Return as JSON array of strings: ["Step 1: ...", "Step 2: ..."]`;
        break;

      case 'cheatsheet':
        systemPrompt = 'You are a content strategist. Create a quick-reference cheatsheet from blog content.';
        userPrompt = `Create a cheatsheet with key takeaways, tips, and formulas from this blog.
        
Blog Title: ${post.title}
Content: ${content.substring(0, 3000)}

Return as JSON: { "title": "...", "sections": [{ "heading": "...", "items": ["...", "..."] }] }`;
        break;

      case 'template':
        systemPrompt = 'You are a content strategist. Create a reusable template from blog content.';
        userPrompt = `Create a fill-in-the-blank template based on this blog's framework.
        
Blog Title: ${post.title}
Content: ${content.substring(0, 3000)}

Return as JSON: { "title": "...", "description": "...", "fields": [{ "label": "...", "placeholder": "...", "type": "text|textarea|select" }] }`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const result = await generateAIText(systemPrompt, userPrompt, { json: true });

    return NextResponse.json({
      type: magnetType,
      blogTitle: post.title,
      content: result
    });
  } catch (error) {
    console.error('Lead magnet error:', error);
    return NextResponse.json({ error: 'Failed to generate lead magnet' }, { status: 500 });
  }
}
