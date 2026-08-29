/**
 * Shared types for the search provider abstraction.
 *
 * Every provider (Brave, Tavily, DuckDuckGo, SerpApi) implements the
 * {@link SearchProvider} interface so the aggregation layer can treat them
 * uniformly. Providers normalize their native API responses into the common
 * {@link SearchResult} shape below.
 */

/** A single normalized search result returned by any provider. */
export interface SearchResult {
  /** The result title. */
  title: string;
  /** The canonical URL of the result. */
  url: string;
  /** A short text snippet / description of the result. */
  snippet: string;
  /** ISO date string of publication, when the provider exposes it. */
  published?: string;
  /** A 0-1 relevance/quality score assigned by the provider, when available. */
  score?: number;
  /** The name of the provider that produced this result. */
  source: string;
}

/** Options controlling a single provider search. */
export interface SearchOptions {
  /** Maximum number of results to request. */
  count?: number;
  /** Provider-specific freshness filter (e.g. Brave "pd"/"pw"/"pm"/"py"). */
  freshness?: string;
  /** Number of days back to restrict results to. */
  recency_days?: number;
  /** Request extra snippets from providers that support it (Brave). */
  extraSnippets?: boolean;
}

/** A search provider that can be queried and returns normalized results. */
export interface SearchProvider {
  /** Stable provider identifier (e.g. "brave", "tavily", "duckduckgo"). */
  name: string;
  /**
   * Run a search and return normalized results.
   *
   * Implementations MUST NOT throw on provider errors (missing key, HTTP
   * 401/429, timeout). They return an empty array and log a warning instead,
   * so one failing provider never breaks the aggregate search.
   */
  search(query: string, opts: SearchOptions): Promise<SearchResult[]>;
}
