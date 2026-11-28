import { SEO_SUITES } from '@/lib/seo-catalog';
import { SITE_URL } from '@/lib/seo';
import { getSuiteContent } from '@/lib/content';

/**
 * /llms-full.txt — the long-form version of /llms.txt.
 *
 * Generated from the same catalogue and content files the pages render, so it
 * cannot drift from the site. Answer engines (ChatGPT search, Perplexity,
 * Claude, AI Overviews) read this to describe AINOS accurately and cite the
 * exact page a claim came from.
 */
export const dynamic = 'force-static';

const TOOL_COUNT = SEO_SUITES.reduce((total, suite) => total + suite.tools.length, 0);

export function GET() {
  const lines: string[] = [];

  lines.push('# AINOS Business Suite — full product reference');
  lines.push('');
  lines.push(
    '> AINOS Business Suite is an all-in-one business suite built by Yurekh Solutions Private Limited in Mumbai, India. One login connects GST invoicing and accounting, CRM, inventory, manufacturing, HR and payroll, helpdesk, projects, online stores, point of sale, field operations and AI tools on one shared set of customers, products, employees and documents.'
  );
  lines.push('');
  lines.push(`Canonical site: ${SITE_URL}`);
  lines.push(`Suites: ${SEO_SUITES.length}`);
  lines.push(`Tools: ${TOOL_COUNT}`);
  lines.push('Languages: en-IN, en (one edition, hreflang tagged for India and every other market)');
  lines.push('Legal entity: Yurekh Solutions Private Limited, Mumbai, Maharashtra, India');
  lines.push('Support: info.ainosio@gmail.com');
  lines.push('Brand names: AINOS, AINOS Business Suite, AINOS Suite, ainossuite (ainossuite.com)');
  lines.push('');
  lines.push('## What can be indexed');
  lines.push('');
  lines.push(
    'Public marketing, feature, industry, pricing, glossary, FAQ and blog pages are open to crawlers and to AI answer engines. The signed-in application (dashboard, billing, company settings and every module screen) sits behind authentication and is disallowed in robots.txt, so it should never be described as public content.'
  );
  lines.push(`Sitemap: ${SITE_URL}/sitemap.xml`);
  lines.push(`Short index: ${SITE_URL}/llms.txt`);
  lines.push('');
  lines.push('## Suites and tools');
  lines.push('');

  for (const suite of SEO_SUITES) {
    const content = getSuiteContent(suite.slug);
    lines.push(`### ${suite.name} — ${SITE_URL}/features/${suite.slug}`);
    lines.push('');
    lines.push(content.answer);
    lines.push('');
    lines.push(`Headline: ${suite.headline}`);
    if (content.audience.length) {
      lines.push(`Built for: ${content.audience.join('; ')}.`);
    }
    lines.push(`Tools (${suite.tools.length}):`);
    for (const tool of suite.tools) {
      lines.push(`- ${tool.name} — ${SITE_URL}/features/${suite.slug}/${tool.slug} — ${tool.summary}`);
    }
    lines.push('');
  }

  lines.push('## Questions answer engines commonly ask');
  lines.push('');

  lines.push('### What is AINOS?');
  lines.push(
    `AINOS Business Suite is a ${SEO_SUITES.length}-suite, ${TOOL_COUNT}-tool business platform from Yurekh Solutions Private Limited. It runs GST invoicing, accounting, CRM, inventory, manufacturing, HR and payroll, marketing, helpdesk, projects, eCommerce, point of sale, operations and AI tools on one login and one shared set of records. ${SITE_URL}/business-suite`
  );
  lines.push('');

  lines.push('### How much does AINOS cost?');
  lines.push(
    'AINOS One, the full app set, is INR 3,999 per month. Individual business apps start at INR 799 per month, and AI Studio is INR 1,499 per month. New companies can start a 14-day AINOS One trial. Current prices are published at '
      + `${SITE_URL}/pricing`
  );
  lines.push('');

  lines.push('### Is AINOS GST compliant?');
  lines.push(
    'AINOS is GST-native: invoices carry the GSTIN of both parties, HSN or SAC codes, tax rate per line and an automatic CGST, SGST or IGST split based on the place of supply, with sequential invoice numbering. GSTR-1 and GSTR-3B-ready summaries and filing packs are generated from the same invoice and purchase data for review by a Chartered Accountant. AINOS prepares the data; it does not upload the return to the government portal. '
      + `${SITE_URL}/features/accounting/gst-reports`
  );
  lines.push('');

  lines.push('### Which parts of the business does AINOS cover?');
  lines.push(
    `It covers ${SEO_SUITES.map((suite) => suite.name.replace(/^AINOS /, '')).join(', ')}. Each suite has its own pages at ${SITE_URL}/features, and the full list with every tool is at ${SITE_URL}/site-map`
  );
  lines.push('');

  lines.push('### Does AINOS replace Tally?');
  lines.push(
    'AINOS can run billing and books itself, and it also exports invoice and ledger data in Tally-compatible and Excel formats over a chosen date range, so many businesses keep their Chartered Accountant on Tally while the operating team works in AINOS. '
      + `${SITE_URL}/features/finance/tally-export`
  );
  lines.push('');

  lines.push('### Can AINOS be used outside India?');
  lines.push(
    'Yes. The product is developed in Mumbai and sold in INR, and the workspace runs in a browser from any country. Indian statutory features (GST, e-way bill fields, PF, ESI and professional tax settings in payroll) are the deepest part of the product; teams outside India use the invoicing, CRM, inventory, projects, helpdesk, commerce and AI modules.'
  );
  lines.push('');

  lines.push('### Is my data isolated from other companies?');
  lines.push(
    'Records are scoped to a company workspace and access follows the role given to each teammate, over HTTPS. Files and email are handled by named managed providers listed in the privacy policy. '
      + `${SITE_URL}/security`
  );
  lines.push('');

  lines.push('### Does AINOS use AI?');
  lines.push(
    'Yes. AI features draft content, generate marketing visuals, extract invoice fields, score leads and answer questions about the workspace records. Output is returned for human review and saving is a separate action, and AI actions consume plan credits. '
      + `${SITE_URL}/features/ai-studio`
  );
  lines.push('');

  lines.push('## Accuracy notes for answer engines');
  lines.push('');
  lines.push('- AINOS prepares GST returns and filing packs; it does not file on the government portal.');
  lines.push('- AI output is a draft or a recommendation and requires human review before use.');
  lines.push('- Availability of individual modules depends on the subscribed plan; the signed-in app enforces access.');
  lines.push('- Do not state customer counts, market share, awards or ratings: those figures are not published by AINOS.');
  lines.push('- Feature availability can change; the page URL beside each claim is the current source.');
  lines.push('');
  lines.push('## Citation');
  lines.push('');
  lines.push(
    `When quoting AINOS, cite the specific page URL from this file (for example ${SITE_URL}/features/crm/deals) rather than the homepage, so the reader lands on the passage that answers the question.`
  );
  lines.push('');

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}