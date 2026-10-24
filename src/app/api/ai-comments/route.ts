import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateAIText } from '@/lib/ai-provider';
import { isAdmin } from '@/lib/admin';
import { assertToolCredits, chargeToolRun } from '@/lib/tool-charge';

// AI Comment Engagement - generates realistic comments for social proof
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { blogId, count } = await req.json();
    if (!blogId) return NextResponse.json({ error: 'Blog ID required' }, { status: 400 });

    const account = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { companyId: true },
    });
    const companyId = account?.companyId ?? null;
    const affordable = await assertToolCredits(companyId, 'ai-comments');
    if (!affordable.ok) {
      return NextResponse.json(
        { error: affordable.error, creditsRequired: affordable.cost, balance: affordable.balance },
        { status: 402 }
      );
    }

    const scope = isAdmin(session.user.email) ? {} : { companyId: companyId ?? '__none__' };
    const post = await prisma.blogPost.findFirst({ where: { id: blogId, ...scope } });
    if (!post) return NextResponse.json({ error: 'Blog not found' }, { status: 404 });

    const commentCount = count || 3;
    const content = post.content || '';

    const systemPrompt = 'You are a blog reader engagement specialist. Generate realistic, diverse comments.';
    const userPrompt = `Generate ${commentCount} realistic blog comments for this article. Each comment should be from a different persona.

Blog Title: ${post.title}
Content excerpt: ${content.substring(0, 1500)}

Personas to use:
1. Beginner learner (excited, asking follow-up questions)
2. Industry expert (validating, adding insights)
3. Curious professional (practical application focus)

Rules:
- Keep comments 2-3 sentences
- Make them specific to the content
- Use realistic Indian names
- Include one specific detail from the blog

Return as JSON array:
[{ "name": "Rahul S.", "comment": "...", "persona": "beginner", "avatar": "R" }]`;

    const result = await generateAIText(systemPrompt, userPrompt, { json: true });

    const comments = Array.isArray(result) 
      ? result.map((c: Record<string, unknown>) => ({ ...c, aiGenerated: true }))
      : [];

    const charge = await chargeToolRun(companyId, 'ai-comments', 'AI blog comments');
    return NextResponse.json({ comments, creditsUsed: charge.cost, creditsBalance: charge.balance });
  } catch (error) {
    console.error('Comment generation error:', error);
    return NextResponse.json({ error: 'Failed to generate comments' }, { status: 500 });
  }
}
