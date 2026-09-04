import * as cheerio from "cheerio";

import { parseRetryAfter, withRetry } from "../utils/retry.js";
import type { SearchOptions, SearchProvider, SearchResult } from "./types.js";
import { ProviderBlockedError } from "./types.js";
import { CoolingDownError, limiterFor } from "../utils/rateLimit.js";

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
    // Paced so an expanded research question does not fire several queries at
    // the endpoint at once, which is what earns a challenge page.
    const limiter = limiterFor("duckduckgo");

    try {
      const response = await limiter.schedule(() =>
        withRetry(
        () =>
          fetch(`${DDG_ENDPOINT}?${params.toString()}`, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (compatible; BetterWebSearch-MCP/1.0; +https://github.com)",
              Accept: "text/html",
            },
            signal: controller.signal,
          }),
          { retryOn: [429, 503], retryNetworkErrors: true },
        ),
      );

      if (!response.ok) {
        limiter.startCooldown(
          parseRetryAfter(response.headers?.get("retry-after")) ??
            undefined,
        );
        throw new ProviderBlockedError(
          "duckduckgo",
          `endpoint returned ${response.status}`,
        );
      }

      const html = await response.text();
      // A challenge page is served with a 2xx status, so `response.ok` does
      // not catch it. Parsing one yields no matches and used to be reported as
      // "no results", which is indistinguishable from a genuinely empty search
      // and made rate limiting look like a broken query.
      if (isChallengePage(html)) {
        // Back off rather than keep asking: further requests during the
        // cooldown fail immediately instead of deepening the block.
        limiter.startCooldown();
        throw new ProviderBlockedError(
          "duckduckgo",
          `rate limited (HTTP ${response.status} challenge page)`,
        );
      }
      limiter.clearCooldown();
      return parseHtmlResults(html, opts.count ?? 10);
    } catch (error) {
      // A block is not the same as an empty result set: let it reach the
      // aggregator so callers can be told the search was refused.
      if (error instanceof ProviderBlockedError) {
        throw error;
      }
      // A cooldown is a refusal too, reported with the reason and the wait.
      if (error instanceof CoolingDownError) {
        throw new ProviderBlockedError("duckduckgo", error.message);
      }
      console.warn(
        `[duckduckgo] search failed (${error instanceof Error ? error.message : String(error)}); returning no results.`,
      );
      return [];
    } finally {
      clearTimeout(timer);
    }
  }
}

/**
 * Whether the HTML is a bot-detection challenge rather than a result page.
 *
 * The endpoint answers a throttled request with a 2xx status and an anomaly
 * page, so status alone cannot tell the two apart. Requiring both the absence
 * of result markup and a challenge marker avoids calling a genuinely empty
 * search a block.
 */
export function isChallengePage(html: string): boolean {
  if (html.includes("result__a") || html.includes('class="result')) {
    return false;
  }
  return /anomaly|unusual traffic|captcha|blocked/i.test(html);
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
