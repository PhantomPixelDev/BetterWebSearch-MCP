import { BraveProvider } from "./brave.js";
import { DuckDuckGoProvider } from "./duckduckgo.js";
import { TavilyProvider } from "./tavily.js";
import type { SearchOptions, SearchProvider, SearchResult } from "./types.js";
import { loadConfig } from "../utils/config.js";

/**
 * Build the list of enabled providers based on environment keys.
 *
 * - Brave: enabled when `BRAVE_API_KEY` (or BETTER_WEB_SEARCH_BRAVE_API_KEY) is set.
 * - Tavily: enabled when `TAVILY_API_KEY` (or BETTER_WEB_SEARCH_TAVILY_API_KEY) is set.
 * - DuckDuckGo: always enabled (keyless free fallback) — zero-config.
 *
 * SerpApi is deliberately absent: `SerpApiProvider` is still a stub, so
 * including it only added a no-op call to every aggregation.
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

  return providers;
}

/** Wall-clock budget for a single provider, in milliseconds. */
export const PROVIDER_TIMEOUT_MS = 10_000;

/**
 * Reject with a clear error if `promise` has not settled within `ms`.
 *
 * The timer is always cleared, so a fast provider never keeps the process
 * alive waiting on its own timeout.
 */
function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`provider "${label}" timed out after ${ms}ms`)),
      ms,
    );
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }) as Promise<T>;
}

/**
 * Aggregate search across all enabled providers.
 *
 * Uses `Promise.allSettled` so one failing provider never aborts the others,
 * and caps each provider at {@link PROVIDER_TIMEOUT_MS} so one hung provider
 * cannot gate the whole search — the others' results are still returned.
 * Rejected and timed-out providers are logged as warnings and skipped;
 * fulfilled results are flattened into a single array.
 */
export async function aggregateSearch(
  query: string,
  opts: SearchOptions = {},
): Promise<SearchResult[]> {
  const providers = enabledProviders();
  const settled = await Promise.allSettled(
    providers.map((provider) =>
      withTimeout(
        provider.search(query, opts),
        PROVIDER_TIMEOUT_MS,
        provider.name,
      ),
    ),
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
