import { SEO_SUITES, suiteBySlug, toolBySlugs } from '@/lib/seo-catalog';
import { SUITE_CONTENT } from './suites';
import { TOOL_CONTENT_A } from './tools-a';
import { TOOL_CONTENT_B } from './tools-b';
import { TOOL_CONTENT_C } from './tools-c';
import type { ContentFaq, SuitePageContent, ToolPageContent } from './types';

export type { ContentFaq, ContentStep, SuitePageContent, ToolPageContent } from './types';

const TOOL_CONTENT: Record<string, ToolPageContent> = {
  ...TOOL_CONTENT_A,
  ...TOOL_CONTENT_B,
  ...TOOL_CONTENT_C,
};

export const toolContentKey = (suiteSlug: string, toolSlug: string): string => `${suiteSlug}/${toolSlug}`;

/**
 * Content for one tool page. Falls back to the catalogue summary so a newly
 * added tool still renders a complete page instead of failing the build.
 */
export function getToolContent(suiteSlug: string, toolSlug: string): ToolPageContent {
  const explicit = TOOL_CONTENT[toolContentKey(suiteSlug, toolSlug)];
  if (explicit) return explicit;

  const found = toolBySlugs(suiteSlug, toolSlug);
  const tool = found?.tool;
  const suiteName = found?.suite.name ?? 'AINOS';
  return {
    answer: tool?.summary ?? `${suiteName} runs inside the AINOS Business Suite.`,
    bestFor: ['Teams replacing a disconnected point tool'],
    steps: (tool?.features ?? []).slice(0, 3).map((feature, index) => ({
      title: `Step ${index + 1}`,
      body: feature,
    })),
    links: [],
    faqs: [],
  };
}

/** Content for one suite page, with the same fallback behaviour. */
export function getSuiteContent(suiteSlug: string): SuitePageContent {
  const explicit = SUITE_CONTENT[suiteSlug];
  if (explicit) return explicit;

  const suite = suiteBySlug(suiteSlug);
  return {
    answer: suite?.summary ?? 'This suite runs inside the AINOS Business Suite.',
    audience: ['Businesses replacing separate point tools'],
    problems: [],
    workflow: (suite?.tools ?? []).slice(0, 3).map((tool) => ({
      title: tool.name,
      body: tool.summary,
    })),
    faqs: [],
    pairsWith: [],
  };
}

export interface ResolvedToolLink {
  name: string;
  summary: string;
  href: string;
}

/**
 * Turns `suite/tool` keys into real links. Unknown keys are dropped rather than
 * rendered broken, so a typo in content cannot produce a 404 on a live page.
 */
export function resolveToolLinks(keys: string[] = []): ResolvedToolLink[] {
  const out: ResolvedToolLink[] = [];
  const seen = new Set<string>();
  for (const key of keys) {
    const [suiteSlug, toolSlug] = key.split('/');
    if (!suiteSlug || !toolSlug) continue;
    const found = toolBySlugs(suiteSlug, toolSlug);
    if (!found) continue;
    const href = `/features/${suiteSlug}/${toolSlug}`;
    if (seen.has(href)) continue;
    seen.add(href);
    out.push({ name: found.tool.name, summary: found.tool.summary, href });
  }
  return out;
}

/** Every content key in the catalogue, useful for coverage checks. */
export function catalogContentKeys(): string[] {
  return SEO_SUITES.flatMap((suite) => suite.tools.map((tool) => toolContentKey(suite.slug, tool.slug)));
}

/**
 * FAQPage markup for any list of question/answer pairs. Google reads one
 * FAQPage per page, and answer engines quote the `acceptedAnswer` text.
 */
export function faqPageJsonLd(pageUrl: string, faqs: ContentFaq[]): Record<string, unknown> | null {
  if (!faqs.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    url: pageUrl,
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}