import type { SearchOptions, SearchProvider, SearchResult } from "./types.js";

/**
 * SerpApi provider stub (deferred).
 *
 * SerpApi integration is not implemented yet. This stub satisfies the
 * {@link SearchProvider} contract so the aggregation layer can include it
 * without special-casing, but always returns no results.
 */
export class SerpApiProvider implements SearchProvider {
  readonly name = "serpapi";

  async search(_query: string, _opts: SearchOptions): Promise<SearchResult[]> {
    return [];
  }
}
