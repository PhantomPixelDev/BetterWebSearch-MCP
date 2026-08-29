/**
 * Level-1 readability extraction.
 *
 * Strips non-content nodes (script/style/link/svg/data images) with cheerio,
 * then runs Mozilla Readability over a JSDOM clone to isolate the main
 * article, and finally converts the article HTML to Markdown with turndown.
 */

import * as cheerio from "cheerio";
import { JSDOM } from "jsdom";
import { Readability, isProbablyReaderable } from "@mozilla/readability";
import TurndownService from "turndown";

/** The result of a readability extraction. */
export interface ReadabilityResult {
  /** The article title. */
  title: string;
  /** The article content converted to Markdown. */
  contentMarkdown: string;
  /** Plain-text content with all HTML tags removed. */
  textContent: string;
  /** A short excerpt / description of the article. */
  excerpt: string;
  /** Length of the article in characters. */
  length: number;
  /** Author metadata, when present. */
  byline: string;
}

/** Selectors for nodes that never contribute to readable content. */
const STRIP_SELECTOR =
  "script, style, link, svg, noscript, iframe, [data-src], img[src^='data:']";

/**
 * Extract the main article from an HTML page.
 *
 * 1. Cheerio pre-pass removes script/style/link/svg/data-image nodes so they
 *    never pollute the article or the Markdown output.
 * 2. The cleaned HTML is loaded into JSDOM (with the page URL for correct
 *    relative-link resolution).
 * 3. Mozilla Readability parses the document into an article.
 * 4. Turndown converts the article HTML to Markdown.
 *
 * Returns `null` when the page has no readable article (Readability.parse
 * returns null), so callers can escalate to a different extraction tier.
 */
export function extractWithReadability(
  html: string,
  url: string,
): ReadabilityResult | null {
  const $ = cheerio.load(html);
  $(STRIP_SELECTOR).remove();
  const cleanedHtml = $.html();

  const dom = new JSDOM(cleanedHtml, { url });
  const doc = dom.window.document;

  // Bail out early when the page does not look like a readable article.
  if (!isProbablyReaderable(doc)) {
    return null;
  }

  const article = new Readability(doc).parse();
  if (article === null) {
    return null;
  }

  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  const contentMarkdown = turndown.turndown(article.content);

  return {
    title: article.title,
    contentMarkdown,
    textContent: article.textContent,
    excerpt: article.excerpt,
    length: article.length,
    byline: article.byline,
  };
}
