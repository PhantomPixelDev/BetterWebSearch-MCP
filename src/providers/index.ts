import { BraveProvider } from "./brave.js";
import { DuckDuckGoProvider } from "./duckduckgo.js";
import { SerpApiProvider } from "./serpapi.js";
import { TavilyProvider } from "./tavily.js";
import type { SearchOptions, SearchProvider, SearchResult } from "./types.js";
import { loadConfig } from "../utils/config.js";

/**
 * Build the list of enabled providers based on environment keys.
 *
 * - Brave: enabled when `BRAVE_API_KEY` (or BETTER_WEB_SEARCH_BRAVE_API_KEY) is set.
 * - Tavily: enabled when `TAVILY_API_KEY` (or BETTER_WEB_SEARCH_TAVILY_API_KEY) is set.
 * - DuckDuckGo: always enabled (keyless free fallback) — zero-config.
 * - SerpApi: stub, always included (returns no results until implemented).
 */
export function enabledProviders(): SearchProvider[] {
  const cfg = loadConfig();
  const providers: SearchProvider[] = [];

  if (cfg.braveApiKey) {
    providers.push(new BraveProvider());
  }
  if (cfg.tavilyApiKey) {
    providers.push(new TavilyProvider());
  }
  providers.push(new DuckDuckGoProvider());
  providers.push(new SerpApiProvider());

  return providers;
}

/**
 * Aggregate search across all enabled providers.
 *
 * Uses `Promise.allSettled` so one failing provider never aborts the others.
 * Rejected providers are logged as warnings and skipped; fulfilled results
 * are flattened into a single array.
 */
export async function aggregateSearch(
  query: string,
  opts: SearchOptions = {},
): Promise<SearchResult[]> {
  const providers = enabledProviders();
  const settled = await Promise.allSettled(
    providers.map((provider) => provider.search(query, opts)),
  );

  const results: SearchResult[] = [];
  settled.forEach((outcome, index) => {
    const provider = providers[index];
    if (outcome.status === "rejected") {
      console.warn(
        `[aggregate] provider "${provider?.name ?? "unknown"}" rejected: ${outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason)}`,
      );
      return;
    }
    results.push(...outcome.value);
  });

  return results;
}
