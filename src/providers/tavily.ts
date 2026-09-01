import { withRetry } from "../utils/retry.js";
import type { SearchOptions, SearchProvider, SearchResult } from "./types.js";

const TAVILY_ENDPOINT = "https://api.tavily.com/search";
const TIMEOUT_MS = 8_000;

interface TavilyResult {
  title?: string;
  url?: string;
  content?: string;
  published_date?: string;
  score?: number;
}

interface TavilyApiResponse {
  results?: TavilyResult[];
}

/**
 * Tavily Search provider (optional).
 *
 * Requires `TAVILY_API_KEY` in the environment. When the key is missing or
 * the request fails, it returns an empty array and logs a warning rather
 * than throwing.
 */
export class TavilyProvider implements SearchProvider {
  readonly name = "tavily";

  async search(query: string, opts: SearchOptions): Promise<SearchResult[]> {
    const { loadConfig } = await import("../utils/config.js");
    const apiKey = loadConfig().tavilyApiKey;
    if (!apiKey) {
      console.warn("[tavily] TAVILY_API_KEY is not set; returning no results.");
      return [];
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await withRetry(
        () =>
          fetch(TAVILY_ENDPOINT, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query,
              max_results: opts.count ?? 10,
              search_depth: "advanced",
              ...(opts.recency_days
                ? { time_range: `${opts.recency_days}d` }
                : {}),
            }),
            signal: controller.signal,
          }),
        { retryOn: [429, 503], retryNetworkErrors: true },
      );

      if (!response.ok) {
        console.warn(
          `[tavily] API returned ${response.status}; returning no results.`,
        );
        return [];
      }

      const data = (await response.json()) as TavilyApiResponse;
      const results = data.results ?? [];
      return results
        .filter((r) => r.url && r.title)
        .map((r) => ({
          title: r.title ?? "",
          url: r.url ?? "",
          snippet: r.content ?? "",
          published: r.published_date,
          score: r.score,
          source: this.name,
        }));
    } catch (error) {
      console.warn(
        `[tavily] search failed (${error instanceof Error ? error.message : String(error)}); returning no results.`,
      );
      return [];
    } finally {
      clearTimeout(timer);
    }
  }
}
