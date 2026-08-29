import type { SearchResult } from "../providers/types.js";

/** Query parameters that are pure tracking noise and never change the page. */
const TRACKING_PARAMS = new Set(["gclid", "fbclid"]);

/**
 * Normalize a URL to a canonical form suitable for deduplication.
 *
 * - Lowercases the hostname.
 * - Strips `utm_*`, `gclid`, and `fbclid` query parameters.
 * - Sorts the remaining query parameters for stable ordering.
 * - Removes a trailing slash except for the root path.
 * - Drops the hash/fragment.
 *
 * Returns `undefined` for malformed URLs so callers can skip them rather
 * than throw.
 */
export function normalizeUrl(rawUrl: string): string | undefined {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return undefined;
  }

  url.hash = "";
  url.hostname = url.hostname.toLowerCase();

  const params = url.searchParams;
  for (const key of [...params.keys()]) {
    if (key.toLowerCase().startsWith("utm_") || TRACKING_PARAMS.has(key.toLowerCase())) {
      params.delete(key);
    }
  }
  // Sort remaining params for deterministic canonical form.
  params.sort();

  let path = url.pathname;
  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }
  url.pathname = path;

  return url.toString();
}

/**
 * Deduplicate search results by normalized URL, keeping the highest score
 * for each canonical URL. Malformed URLs are skipped, not thrown.
 *
 * Does not mutate the input array.
 */
export function deduplicate(results: readonly SearchResult[]): SearchResult[] {
  const bestByUrl = new Map<string, SearchResult>();

  for (const result of results) {
    const normalized = normalizeUrl(result.url);
    if (normalized === undefined) {
      continue;
    }
    const existing = bestByUrl.get(normalized);
    if (existing === undefined || scoreOf(result) > scoreOf(existing)) {
      bestByUrl.set(normalized, result);
    }
  }

  return [...bestByUrl.values()];
}

/** Provider score, defaulting to 0 when absent. */
function scoreOf(result: SearchResult): number {
  return result.score ?? 0;
}
