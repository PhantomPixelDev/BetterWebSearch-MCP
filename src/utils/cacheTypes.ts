/**
 * Shared types and TTL constants for the cache backends.
 *
 * Kept in their own module so both `cache.ts` (SQLite) and `memoryCache.ts`
 * (in-memory fallback) can reference the same contract without a circular
 * import.
 */

/** TTL for cached search results, in milliseconds (15 minutes). */
export const SEARCH_TTL_MS = 15 * 60 * 1000;

/** TTL for cached pages, in milliseconds (1 hour). */
export const PAGE_TTL_MS = 60 * 60 * 1000;

/** A cached page entry. */
export interface PageCacheEntry {
  url: string;
  content: string;
  extraction_method: string;
  confidence: number;
  created_at: number;
}

/** A discovered API endpoint pattern. */
export interface ApiPattern {
  id: number;
  domain: string;
  endpoint_pattern: string;
  method: string;
  content_type: string;
  discovered_at: number;
}

/** Options controlling the Cache backend. */
export interface CacheOptions {
  /** Path to the SQLite database file. Defaults to `data/cache.db`. */
  dbPath?: string;
  /** Force the in-memory Map backend (used in CI / tests). */
  memory?: boolean;
}