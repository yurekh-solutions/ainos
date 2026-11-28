import { describe, expect, it } from 'vitest';
import { SEO_SUITES, toolBySlugs } from '@/lib/seo-catalog';
import { catalogContentKeys } from '@/lib/content';
import { SUITE_CONTENT } from '@/lib/content/suites';
import { TOOL_CONTENT_A } from '@/lib/content/tools-a';
import { TOOL_CONTENT_B } from '@/lib/content/tools-b';
import { TOOL_CONTENT_C } from '@/lib/content/tools-c';

const TOOL_CONTENT = { ...TOOL_CONTENT_A, ...TOOL_CONTENT_B, ...TOOL_CONTENT_C };

/**
 * The public /features pages are the only crawlable description of the product,
 * so a missing content entry silently turns a page back into thin content.
 * These checks fail the build instead.
 */
describe('public SEO content coverage', () => {
  const keys = catalogContentKeys();

  it('has one content key per catalogue tool', () => {
    const expected = SEO_SUITES.reduce((total, suite) => total + suite.tools.length, 0);
    expect(keys).toHaveLength(expected);
    expect(new Set(keys).size).toBe(expected);
  });

  it('covers every suite with an answer, audience and FAQ', () => {
    for (const suite of SEO_SUITES) {
      const content = SUITE_CONTENT[suite.slug];
      expect(content, `missing suite content for ${suite.slug}`).toBeTruthy();
      expect(content.answer.length).toBeGreaterThan(120);
      expect(content.audience.length).toBeGreaterThanOrEqual(2);
      expect(content.workflow.length).toBe(3);
      expect(content.faqs.length).toBeGreaterThanOrEqual(2);
      for (const faq of content.faqs) {
        expect(faq.question.endsWith('?')).toBe(true);
        expect(faq.answer.length).toBeGreaterThan(60);
      }
    }
  });

  it('pairs every suite with real suites', () => {
    const slugs = new Set(SEO_SUITES.map((suite) => suite.slug));
    for (const suite of SEO_SUITES) {
      for (const pair of SUITE_CONTENT[suite.slug].pairsWith) {
        expect(slugs.has(pair), `${suite.slug} pairs with unknown suite ${pair}`).toBe(true);
      }
    }
  });

  it('writes a full page for every tool', () => {
    for (const key of keys) {
      const content = TOOL_CONTENT[key];
      expect(content, `missing tool content for ${key}`).toBeTruthy();
      expect(content.answer.length).toBeGreaterThan(100);
      expect(content.bestFor.length).toBeGreaterThanOrEqual(2);
      expect(content.steps).toHaveLength(3);
      expect(content.faqs.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('only links tools that exist', () => {
    for (const [key, content] of Object.entries(TOOL_CONTENT)) {
      for (const link of content.links) {
        const [suiteSlug, toolSlug] = link.split('/');
        expect(
          toolBySlugs(suiteSlug, toolSlug),
          `${key} links to unknown tool ${link}`
        ).toBeTruthy();
      }
    }
  });
});