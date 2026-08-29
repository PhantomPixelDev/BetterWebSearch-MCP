/**
 * Lightweight metadata extraction from raw HTML using cheerio.
 *
 * Pulls the title, description, published date, author, and site name from
 * the standard `<meta>` / OpenGraph / article tags. Never throws on missing
 * fields - each is optional.
 */

import * as cheerio from "cheerio";

/** The result of a metadata extraction. */
export interface PageMetadata {
  /** The `<title>` tag text. */
  title: string;
  /** Description from `og:description` or `meta[name=description]`. */
  description: string;
  /** Published date from `article:published_time` / `datePublished`. */
  published: string;
  /** Author from `article:author` / `meta[name=author]`. */
  author: string;
  /** Site name from `og:site_name`. */
  siteName: string;
}

/** Read the `content` attribute of the first matching meta tag, if any. */
function metaContent($: cheerio.CheerioAPI, selector: string): string {
  return $(selector).first().attr("content")?.trim() ?? "";
}

/**
 * Extract page metadata from raw HTML.
 *
 * All fields are optional and default to an empty string when absent, so
 * this never throws on sparse or malformed documents.
 */
export function extractMetadata(html: string): PageMetadata {
  const $ = cheerio.load(html);

  const title = $("title").first().text().trim();

  const description =
    metaContent($, 'meta[property="og:description"]') ||
    metaContent($, 'meta[name="description"]');

  const published =
    metaContent($, 'meta[property="article:published_time"]') ||
    metaContent($, 'meta[name="datePublished"]') ||
    metaContent($, 'meta[itemprop="datePublished"]');

  const author =
    metaContent($, 'meta[property="article:author"]') ||
    metaContent($, 'meta[name="author"]');

  const siteName = metaContent($, 'meta[property="og:site_name"]');

  return { title, description, published, author, siteName };
}
