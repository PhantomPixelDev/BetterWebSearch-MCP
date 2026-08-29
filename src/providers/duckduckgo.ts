import * as cheerio from "cheerio";

import type { SearchOptions, SearchProvider, SearchResult } from "./types.js";

const DDG_ENDPOINT = "https://html.duckduckgo.com/html/";
const TIMEOUT_MS = 8_000;

/**
 * DuckDuckGo provider (free, keyless fallback).
 *
 * Scrapes the public HTML search endpoint and parses results with cheerio.
 * Always enabled — no API key required. On any failure (network, timeout,
 * parse) it returns an empty array and logs a warning rather than throwing.
 */
export class DuckDuckGoProvider implements SearchProvider {
  readonly name = "duckduckgo";

  async search(query: string, opts: SearchOptions): Promise<SearchResult[]> {
    const params = new URLSearchParams({ q: query });
    if (opts.count) {
      // The HTML endpoint returns ~30 results per page; we slice client-side.
      void opts.count;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(`${DDG_ENDPOINT}?${params.toString()}`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; BetterWebSearch-MCP/1.0; +https://github.com)",
          Accept: "text/html",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        console.warn(
          `[duckduckgo] endpoint returned ${response.status}; returning no results.`,
        );
        return [];
      }

      const html = await response.text();
      return parseHtmlResults(html, opts.count ?? 10);
    } catch (error) {
      console.warn(
        `[duckduckgo] search failed (${error instanceof Error ? error.message : String(error)}); returning no results.`,
      );
      return [];
    } finally {
      clearTimeout(timer);
    }
  }
}

/** Parse DuckDuckGo HTML search results into normalized {@link SearchResult}s. */
export function parseHtmlResults(html: string, limit: number): SearchResult[] {
  const $ = cheerio.load(html);
  const results: SearchResult[] = [];

  $(".result").each((_index, element) => {
    if (results.length >= limit) {
      return;
    }
    // DuckDuckGo renders the title inside `.result__a` (the anchor) and the
    // snippet inside `.result__snippet`. Fall back to `.result__title` for
    // robustness across markup variations.
    const title =
      $(element).find(".result__a").text().trim() ||
      $(element).find(".result__title").text().trim();
    const url = $(element).find(".result__url").attr("href") ?? "";
    const snippet = $(element).find(".result__snippet").text().trim();

    if (!title || !url) {
      return;
    }
    results.push({
      title,
      url: decodeDdgUrl(url),
      snippet,
      source: "duckduckgo",
    });
  });

  return results;
}

/**
 * DuckDuckGo wraps result URLs in a redirect (`//duckduckgo.com/l/?uddg=...`).
 * Decode the `uddg` parameter back to the real destination URL.
 */
function decodeDdgUrl(raw: string): string {
  try {
    const parsed = new URL(raw, "https://duckduckgo.com");
    const target = parsed.searchParams.get("uddg");
    if (target) {
      return target;
    }
    return parsed.toString();
  } catch {
    return raw;
  }
}
