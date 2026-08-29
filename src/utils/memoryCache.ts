/**
 * In-memory Map backend for the cache.
 *
 * Used when better-sqlite3 is unavailable (e.g. CI without native bindings)
 * or when `memory: true` is requested. Mirrors the SQLite backend's TTL
 * semantics exactly so callers cannot tell the backends apart.
 */

import type { ApiPattern, PageCacheEntry } from "./cacheTypes.js";
import { PAGE_TTL_MS, SEARCH_TTL_MS } from "./cacheTypes.js";

/** A memory-backend entry with an absolute expiry timestamp. */
interface MemoryEntry {
  value: unknown;
  expiresAt: number;
}

/**
 * A cache backend backed by a plain `Map`.
 *
 * Search entries expire after {@link SEARCH_TTL_MS}, page entries after
 * {@link PAGE_TTL_MS}; domain profiles and API patterns never expire.
 */
export class MemoryCache {
  private readonly memory = new Map<string, MemoryEntry>();

  /** Drop every entry (used on close). */
  clear(): void {
    this.memory.clear();
  }

  /** Read a search result, or `null` on miss / expiry. */
  getSearch(key: string): unknown | null {
    return this.memoryGet(`search:${key}`);
  }

  /** Store a search result, refreshing the TTL on overwrite. */
  setSearch(key: string, _query: string, results: unknown): void {
    this.memorySet(`search:${key}`, results, Date.now() + SEARCH_TTL_MS);
  }

  /** Read a cached page entry, or `null` on miss / expiry. */
  getPage(url: string): PageCacheEntry | null {
    const entry = this.memoryGet(`page:${url}`);
    return entry === null ? null : (entry as PageCacheEntry);
  }

  /** Store a page extraction, refreshing the TTL on overwrite. */
  setPage(
    url: string,
    content: string,
    extractionMethod: string,
    confidence: number,
  ): void {
    const entry: PageCacheEntry = {
      url,
      content,
      extraction_method: extractionMethod,
      confidence,
      created_at: Date.now(),
    };
    this.memorySet(`page:${url}`, entry, Date.now() + PAGE_TTL_MS);
  }

  /** Read a cached domain profile, or `null` on miss. */
  getDomain(domain: string): unknown | null {
    return this.memoryGet(`domain:${domain}`);
  }

  /** Upsert a domain profile. */
  setDomain(domain: string, profile: unknown): void {
    this.memorySet(`domain:${domain}`, profile, Number.POSITIVE_INFINITY);
  }

  /** Record a discovered API endpoint pattern for a domain. */
  addApiPattern(
    domain: string,
    endpointPattern: string,
    method: string,
    contentType: string,
  ): void {
    const existing = this.memoryGet(`api:${domain}`);
    const list = Array.isArray(existing) ? (existing as ApiPattern[]) : [];
    list.push({
      id: list.length + 1,
      domain,
      endpoint_pattern: endpointPattern,
      method,
      content_type: contentType,
      discovered_at: Date.now(),
    });
    this.memory.set(`api:${domain}`, {
      value: list,
      expiresAt: Number.POSITIVE_INFINITY,
    });
  }

  /** List all API patterns for a domain, newest first. */
  getApiPatterns(domain: string): ApiPattern[] {
    const existing = this.memoryGet(`api:${domain}`);
    const list = Array.isArray(existing) ? (existing as ApiPattern[]) : [];
    return [...list].sort(
      (a, b) => b.discovered_at - a.discovered_at || b.id - a.id,
    );
  }

  /** Delete every search/page entry whose TTL has expired. */
  pruneExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.memory) {
      if (now > entry.expiresAt) {
        this.memory.delete(key);
      }
    }
  }

  /** Read an entry, deleting and returning null when expired. */
  private memoryGet(key: string): unknown | null {
    const entry = this.memory.get(key);
    if (entry === undefined) {
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this.memory.delete(key);
      return null;
    }
    return entry.value;
  }

  /** Store an entry with an absolute expiry timestamp. */
  private memorySet(key: string, value: unknown, expiresAt: number): void {
    this.memory.set(key, { value, expiresAt });
  }
}