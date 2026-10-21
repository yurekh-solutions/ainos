// Shared checks for scheduled, manual, and regenerated articles.
export function tidyBlogContent(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/^\s*```(?:markdown|md)?\s*\n/i, '')
    .replace(/\n```\s*$/i, '')
    .replace(/!\[[^\]]*\]\([^)]+\)\n?/g, '')
    .replace(/<img[^>]*>\n?/gi, '')
    .replace(/^\s*#\s+[^\n]+\n+/, '')
    .trim();
}

export function blogQualityIssue(content: string, minWords = 700, minSections = 4): string | null {
  if (/^\s*[\[{]/.test(content)) return 'Article contains an unparsed response';
  const words = content.replace(/<[^>]*>/g, '').replace(/[#*_`]/g, '').split(/\s+/).filter(Boolean).length;
  const sections = content.match(/^##\s+\S/gm)?.length || 0;
  if (words < minWords) return `Article needs at least ${minWords} words (received ${words})`;
  if (sections < minSections) return `Article needs at least ${minSections} substantive sections`;
  if (/AI generation was temporarily unavailable|Add your conclusion here|\bPoint [123]\b/i.test(content)) {
    return 'Article contains unfinished placeholder text';
  }
  return null;
}

export function blogExcerpt(content: string): string {
  const paragraph = content.split(/\n{2,}/).map(p => p.trim())
    .find(p => p && !/^(#|-|\*|\d+\.|>|\|)/.test(p)) || content;
  const plain = paragraph.replace(/[#*_`>\[\]]/g, '').replace(/\(https?:[^)]+\)/g, '')
    .replace(/\s+/g, ' ').trim();
  return plain.length > 158 ? `${plain.slice(0, 155).replace(/\s+\S*$/, '')}...` : plain;
}

export function cleanBlogTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.filter((v): v is string => typeof v === 'string')
    .map(v => v.replace(/^#/, '').trim())
    .filter(v => {
      if (!v || v.length > 40 || seen.has(v.toLowerCase())) return false;
      seen.add(v.toLowerCase());
      return true;
    }).slice(0, 7);
}
