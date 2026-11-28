/**
 * Long-form, crawlable content for the public suite and tool pages.
 *
 * The app surface sits behind sign-in, so the only thing a search engine or an
 * answer engine can read is the marketing copy. Each entry therefore carries a
 * direct answer (AEO), a short workflow (what the page is actually for), and the
 * questions buyers ask (FAQPage markup). Content lives here rather than in the
 * page files so the sitemap, llms.txt and every render read one source.
 */

export interface ContentFaq {
  question: string;
  answer: string;
}

export interface ContentStep {
  title: string;
  body: string;
}

/** A link to another tool, keyed `suite/tool` so duplicates like `products` resolve. */
export type ToolKey = string;

export interface ToolPageContent {
  /** Two sentences written to be quoted verbatim by an AI answer engine. */
  answer: string;
  /** Who the screen is for — one short line each. */
  bestFor: string[];
  /** The order a team actually works in. */
  steps: ContentStep[];
  /** Records this tool shares with the rest of the suite. */
  links: ToolKey[];
  faqs: ContentFaq[];
}

export interface SuitePageContent {
  /** The definition-style answer that opens the page. */
  answer: string;
  /** Buyer profiles that pick this suite first. */
  audience: string[];
  /** The gaps the suite closes, phrased as an outcome. */
  problems: { title: string; body: string }[];
  /** How a transaction flows through the suite. */
  workflow: ContentStep[];
  faqs: ContentFaq[];
  /** Suites that complete the loop, by slug. */
  pairsWith: string[];
}