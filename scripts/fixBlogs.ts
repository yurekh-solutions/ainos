import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

function safeParseContent(raw: string): { title?: string; slug?: string; excerpt?: string; content?: string; tags?: string[]; category?: string } | null {
  // Strip markdown code fences
  const cleanRaw = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

  // Try direct parse
  try {
    const obj = JSON.parse(cleanRaw);
    if (obj && typeof obj.content === 'string') return obj;
  } catch {}

  // Try balanced extraction
  const firstBrace = cleanRaw.indexOf('{');
  if (firstBrace !== -1) {
    let depth = 0, end = -1, inStr = false, esc = false;
    for (let i = firstBrace; i < cleanRaw.length; i++) {
      const c = cleanRaw[i];
      if (esc) { esc = false; continue; }
      if (c === '\\') { esc = true; continue; }
      if (c === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (c === '{') depth++;
      else if (c === '}') { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end !== -1) {
      try {
        const obj = JSON.parse(cleanRaw.slice(firstBrace, end + 1));
        if (obj && typeof obj.content === 'string') return obj;
      } catch {}
    }
  }

  // Regex salvage
  const contentMatch = cleanRaw.match(/"content"\s*:\s*"([\s\S]*?)(?<!\\)"\s*[,}]/);
  if (contentMatch) {
    const titleMatch = cleanRaw.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const tagsMatch = cleanRaw.match(/"tags"\s*:\s*\[([\s\S]*?)\]/);
    const excerptMatch = cleanRaw.match(/"excerpt"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const slugMatch = cleanRaw.match(/"slug"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const categoryMatch = cleanRaw.match(/"category"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const rawContent = contentMatch[1]
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/\\t/g, '\t');
    return {
      title: titleMatch?.[1],
      slug: slugMatch?.[1],
      excerpt: excerptMatch?.[1]?.slice(0, 160),
      content: rawContent,
      tags: tagsMatch ? tagsMatch[1].match(/"((?:[^"\\]|\\.)*)"/g)?.map(s => s.replace(/^"|"$/g, '').replace(/\\"/g, '"')) || [] : [],
      category: categoryMatch?.[1],
    };
  }
  return null;
}

(async () => {
  // Find blogs where content starts with { (broken JSON literal)
  const blogs = await p.blogPost.findMany({
    orderBy: { createdAt: 'desc' },
  });

  let fixed = 0, skipped = 0, total = 0;
  for (const b of blogs) {
    total++;
    const c = b.content || '';
    // Detect broken: starts with { and contains "content":
    if (!c.trim().startsWith('{')) {
      skipped++;
      continue;
    }
    if (!c.includes('"content"')) {
      skipped++;
      continue;
    }
    console.log(`\n--- Fixing: ${b.title} (${b.id.slice(0, 8)}) ---`);
    const parsed = safeParseContent(c);
    if (!parsed || !parsed.content) {
      console.log('  ❌ Could not parse');
      continue;
    }
    const wordCount = parsed.content.split(/\s+/).filter(Boolean).length;
    const h2Count = (parsed.content.match(/^##\s+/gm) || []).length;
    const h3Count = (parsed.content.match(/^###\s+/gm) || []).length;
    const imgCount = (parsed.content.match(/!\[.*?\]\(.*?\)/g) || []).length;
    console.log(`  Parsed: ${wordCount} words | H2: ${h2Count} | H3: ${h3Count} | Img: ${imgCount} | Tags: ${parsed.tags?.length || 0}`);
    if (wordCount < 500) {
      console.log('  ❌ Content too short, skipping');
      continue;
    }
    await p.blogPost.update({
      where: { id: b.id },
      data: {
        content: parsed.content,
        ...(parsed.title && { title: parsed.title }),
        ...(parsed.slug && { slug: parsed.slug }),
        ...(parsed.excerpt && { excerpt: parsed.excerpt }),
        ...(parsed.tags && { tags: parsed.tags }),
        ...(parsed.category && { category: parsed.category }),
      },
    });
    console.log('  ✅ Fixed');
    fixed++;
  }
  console.log(`\n=== Summary ===`);
  console.log(`Fixed: ${fixed} | Skipped: ${skipped} | Total: ${total}`);
  await p.$disconnect();
})();
