/**
 * Alternative source discovery + search-snippet evidence.
 *
 * When the primary extraction is blocked (403 / paywall) or low-confidence,
 * this module tries public URL variants of the original page (AMP,
 * `?output=1`, `?amp`) and, if those are still blocked, falls back to public
 * search snippets as low-confidence evidence. Only public search + AMP
 * variants are used — no paywall bypass.
 */

import { fetchPage, type FetchedPage } from "./fetch.js";
import { aggregateSearch } from "../providers/index.js";
import type { SearchResult } from "../providers/types.js";
import type { Evidence } from "./evidence.js";
import type { Cache } from "../utils/cache.js";

/** Confidence assigned to search-snippet evidence. */
export const SNIPPET_CONFIDENCE = 0.6;

/** Confidence assigned to a successfully fetched URL variant. */
export const VARIANT_CONFIDENCE = 0.6;

/** Maximum number of search snippets kept as evidence. */
export const MAX_SNIPPETS = 3;

/** Maximum snippet length for page-variant evidence. */
export const MAX_SNIPPET_CHARS = 200;

/** Injectable dependencies, defaulting to the real modules. */
export interface AlternativeDeps {
  /** Page fetcher used for URL variants. */
  fetchPage?: typeof fetchPage;
  /** Search aggregator used for snippet fallback. */
  aggregateSearch?: typeof aggregateSearch;
  /** Page cache consulted before fetching each variant. */
  cache?: Cache;
}

/** Resolved dependencies with real defaults applied. */
type ResolvedDeps = {
  fetchPage: typeof fetchPage;
  aggregateSearch: typeof aggregateSearch;
  cache: Cache | undefined;
};

/**
 * Build the URL variants to try: original, `?output=1`, `/amp`, `?amp`.
 *
 * Query strings are preserved and extended with `&` when present; the `/amp`
 * variant is inserted before the query. Returns the original URL alone when
 * it cannot be parsed.
 */
export function buildAlternativeUrls(url: string): string[] {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return [url];
  }
  const base = parsed.origin + parsed.pathname;
  const query = parsed.search;
  const sep = query === "" ? "?" : "&";
  return [
    url,
    `${base}${query}${sep}output=1`,
    `${base}/amp${query}`,
    `${base}${query}${sep}amp`,
  ];
}

/**
 * Build the search queries for snippet fallback.
 *
 * With a title: quoted exact title, site-restricted quoted title, and
 * title + domain keywords. Without a title: a bare `site:` query so the
 * domain is still searched.
 */
export function buildSearchQueries(
  url: string,
  title: string | null,
): string[] {
  let domain: string;
  try {
    domain = new URL(url).hostname;
  } catch {
    return [];
  }
  const trimmed = title?.trim() ?? "";
  if (trimmed === "") {
    return [`site:${domain}`];
  }
  return [
    `"${trimmed}"`,
    `site:${domain} "${trimmed}"`,
    `${trimmed} ${domain}`,
  ];
}

/** Strip HTML tags to produce a readable snippet. */
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Whether a fetched page is usable (2xx with non-empty HTML). */
function isUsable(page: FetchedPage): boolean {
  return page.status >= 200 && page.status < 300 && page.html.trim() !== "";
}

/**
 * Try each URL variant, returning page evidence on the first success.
 *
 * Each variant is checked against the cache before fetching. A variant is
 * usable when it returns 2xx with non-empty HTML; anything else (403, empty
 * body, timeout, non-HTML) is treated as blocked and the next variant is
 * tried.
 */
async function tryVariants(
  url: string,
  d: ResolvedDeps,
): Promise<Evidence | null> {
  for (const variant of buildAlternativeUrls(url)) {
    const cached = d.cache?.getPage(variant);
    if (cached !== null && cached !== undefined) {
      return {
        source: "page",
        type: "page",
        confidence: cached.confidence,
        url: variant,
        snippet: cached.content.slice(0, MAX_SNIPPET_CHARS),
      };
    }
    try {
      const page = await d.fetchPage(variant);
      if (isUsable(page)) {
        return {
          source: "page",
          type: "page",
          confidence: VARIANT_CONFIDENCE,
          url: variant,
          snippet: stripHtml(page.html).slice(0, MAX_SNIPPET_CHARS),
        };
      }
    } catch {
      // Blocked / timeout / non-HTML — try the next variant.
    }
  }
  return null;
}

/**
 * Discover alternative sources for a blocked or low-confidence page.
 *
 * 1. Tries URL variants (`?output=1`, `/amp`, `?amp`) via {@link fetchPage},
 *    cache-aware, returning the first usable variant as page evidence.
 * 2. If every variant is blocked, runs {@link aggregateSearch} with the
 *    quoted title, a `site:`-restricted query, and title + domain keywords.
 * 3. Treats the top {@link MAX_SNIPPETS} search results as `search_snippet`
 *    evidence at confidence {@link SNIPPET_CONFIDENCE}.
 *
 * Never throws on empty or failing searches — it returns `[]`.
 */
export async function findAlternativeSources(
  url: string,
  title: string | null,
  deps: AlternativeDeps = {},
): Promise<Evidence[]> {
  const d: ResolvedDeps = {
    fetchPage: deps.fetchPage ?? fetchPage,
    aggregateSearch: deps.aggregateSearch ?? aggregateSearch,
    cache: deps.cache,
  };

  const variant = await tryVariants(url, d);
  if (variant !== null) {
    return [variant];
  }

  const queries = buildSearchQueries(url, title);
  const collected: SearchResult[] = [];
  for (const query of queries) {
    try {
      collected.push(
        ...(await d.aggregateSearch(query, { count: MAX_SNIPPETS })),
      );
    } catch {
      // Provider failure — keep whatever we already collected.
    }
  }

  const seen = new Set<string>();
  const unique: SearchResult[] = [];
  for (const result of collected) {
    if (!seen.has(result.url)) {
      seen.add(result.url);
      unique.push(result);
    }
  }

  return unique.slice(0, MAX_SNIPPETS).map((result) => ({
    source: "search_snippet",
    type: "search_snippet",
    confidence: SNIPPET_CONFIDENCE,
    url: result.url,
    snippet: result.snippet,
  }));
}