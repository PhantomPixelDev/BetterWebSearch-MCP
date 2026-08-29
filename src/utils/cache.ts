/**
 * SQLite-backed cache with an in-memory Map fallback.
 *
 * Four tables: `search_cache` (TTL 15 min), `page_cache` (TTL 1 h),
 * `api_patterns`, and `domain_profiles`. When better-sqlite3 is unavailable
 * (e.g. CI without native bindings) the Cache transparently falls back to an
 * in-memory Map with identical semantics, so callers never block on DB
 * errors. Malformed JSON in any column is treated as a miss, never thrown.
 */

import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createRequire } from "node:module";

import { MemoryCache } from "./memoryCache.js";
import type {
  ApiPattern,
  CacheOptions,
  PageCacheEntry,
} from "./cacheTypes.js";
import { PAGE_TTL_MS, SEARCH_TTL_MS } from "./cacheTypes.js";

export { PAGE_TTL_MS, SEARCH_TTL_MS } from "./cacheTypes.js";
export type { ApiPattern, CacheOptions, PageCacheEntry } from "./cacheTypes.js";

const require = createRequire(import.meta.url);

/** The better-sqlite3 module shape (constructor + namespace). */
type DatabaseModule = typeof import("better-sqlite3");
/** The `Database` instance type produced by the constructor. */
type SqliteDatabase = InstanceType<DatabaseModule>;

/** SQLite schema for all four cache tables. */
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS search_cache (
    key TEXT PRIMARY KEY,
    query TEXT NOT NULL,
    results TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS page_cache (
    url TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    extraction_method TEXT NOT NULL,
    confidence REAL NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS api_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT NOT NULL,
    endpoint_pattern TEXT NOT NULL,
    method TEXT NOT NULL,
    content_type TEXT NOT NULL,
    discovered_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS domain_profiles (
    domain TEXT PRIMARY KEY,
    profile TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_api_patterns_domain ON api_patterns(domain);
  CREATE INDEX IF NOT EXISTS idx_search_cache_created_at ON search_cache(created_at);
  CREATE INDEX IF NOT EXISTS idx_page_cache_created_at ON page_cache(created_at);
`;

/** Parse JSON, returning `null` on any malformed input. */
function tryParseJson(raw: string): unknown | null {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

/** Load better-sqlite3, returning null when the native binding is missing. */
function loadDatabase(): DatabaseModule | null {
  try {
    return require("better-sqlite3") as DatabaseModule;
  } catch {
    return null;
  }
}

/**
 * A cache for search results, pages, API patterns, and domain profiles.
 *
 * Prefers a SQLite database at `data/cache.db` (WAL mode, auto-created
 * directory). When better-sqlite3 cannot be loaded, or when `memory: true`
 * is passed, every method transparently operates on an in-memory Map with
 * the same TTL semantics.
 */
export class Cache {
  private readonly db: SqliteDatabase | null;
  private readonly memory: MemoryCache | null;
  private readonly memoryMode: boolean;

  constructor(opts: CacheOptions = {}) {
    const Database = loadDatabase();
    if (opts.memory === true || Database === null) {
      this.memoryMode = true;
      this.db = null;
      this.memory = new MemoryCache();
      return;
    }

    this.memoryMode = false;
    this.memory = null;
    const dbPath = opts.dbPath ?? "data/cache.db";
    mkdirSync(dirname(dbPath), { recursive: true });
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("busy_timeout = 5000");
    db.exec(SCHEMA);
    this.db = db;
    // Best-effort startup prune; empty catch is intentional — never block boot.
    try {
      this.pruneExpired();
    } catch {
      // ignore — stale rows are harmless until the next prune
    }
  }

  /** Whether this instance is running on the in-memory Map backend. */
  get isMemory(): boolean {
    return this.memoryMode;
  }

  /** Close the underlying database (no-op in memory mode). */
  close(): void {
    if (this.db !== null && this.db.open) {
      this.db.close();
    }
    this.memory?.clear();
  }

  // ---- search_cache (TTL 15 min) ----

  /** Read a cached search result, or `null` on miss / expiry / bad JSON. */
  getSearch(key: string): unknown | null {
    if (this.db !== null) {
      const row = this.db
        .prepare("SELECT results, created_at FROM search_cache WHERE key = ?")
        .get(key) as { results: string; created_at: number } | undefined;
      if (row === undefined) {
        return null;
      }
      if (Date.now() - row.created_at > SEARCH_TTL_MS) {
        return null;
      }
      return tryParseJson(row.results);
    }
    return this.memory?.getSearch(key) ?? null;
  }

  /** Store a search result under a key, refreshing the TTL on overwrite. */
  setSearch(key: string, query: string, results: unknown): void {
    if (this.db !== null) {
      this.db
        .prepare(
          `INSERT INTO search_cache (key, query, results, created_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET
             query = excluded.query,
             results = excluded.results,
             created_at = excluded.created_at`,
        )
        .run(key, query, JSON.stringify(results) ?? "null", Date.now());
      return;
    }
    this.memory?.setSearch(key, query, results);
  }

  // ---- page_cache (TTL 1 h) ----

  /** Read a cached page entry, or `null` on miss / expiry. */
  getPage(url: string): PageCacheEntry | null {
    if (this.db !== null) {
      const row = this.db
        .prepare(
          `SELECT url, content, extraction_method, confidence, created_at
           FROM page_cache WHERE url = ?`,
        )
        .get(url) as PageCacheEntry | undefined;
      if (row === undefined) {
        return null;
      }
      if (Date.now() - row.created_at > PAGE_TTL_MS) {
        return null;
      }
      return row;
    }
    return this.memory?.getPage(url) ?? null;
  }

  /** Store a page extraction, refreshing the TTL on overwrite. */
  setPage(
    url: string,
    content: string,
    extractionMethod: string,
    confidence: number,
  ): void {
    if (this.db !== null) {
      this.db
        .prepare(
          `INSERT INTO page_cache (url, content, extraction_method, confidence, created_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(url) DO UPDATE SET
             content = excluded.content,
             extraction_method = excluded.extraction_method,
             confidence = excluded.confidence,
             created_at = excluded.created_at`,
        )
        .run(url, content, extractionMethod, confidence, Date.now());
      return;
    }
    this.memory?.setPage(url, content, extractionMethod, confidence);
  }

  // ---- domain_profiles ----

  /** Read a cached domain profile, or `null` on miss / bad JSON. */
  getDomain(domain: string): unknown | null {
    if (this.db !== null) {
      const row = this.db
        .prepare("SELECT profile FROM domain_profiles WHERE domain = ?")
        .get(domain) as { profile: string } | undefined;
      if (row === undefined) {
        return null;
      }
      return tryParseJson(row.profile);
    }
    return this.memory?.getDomain(domain) ?? null;
  }

  /** Upsert a domain profile (JSON-serialized), refreshing `updated_at`. */
  setDomain(domain: string, profile: unknown): void {
    if (this.db !== null) {
      this.db
        .prepare(
          `INSERT INTO domain_profiles (domain, profile, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(domain) DO UPDATE SET
             profile = excluded.profile,
             updated_at = excluded.updated_at`,
        )
        .run(domain, JSON.stringify(profile) ?? "null", Date.now());
      return;
    }
    this.memory?.setDomain(domain, profile);
  }

  // ---- api_patterns ----

  /** Record a discovered API endpoint pattern for a domain. */
  addApiPattern(
    domain: string,
    endpointPattern: string,
    method: string,
    contentType: string,
  ): void {
    if (this.db !== null) {
      this.db
        .prepare(
          `INSERT INTO api_patterns
             (domain, endpoint_pattern, method, content_type, discovered_at)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .run(domain, endpointPattern, method, contentType, Date.now());
      return;
    }
    this.memory?.addApiPattern(domain, endpointPattern, method, contentType);
  }

  /** List all API patterns discovered for a domain, newest first. */
  getApiPatterns(domain: string): ApiPattern[] {
    if (this.db !== null) {
      return this.db
        .prepare(
          `SELECT id, domain, endpoint_pattern, method, content_type, discovered_at
           FROM api_patterns WHERE domain = ? ORDER BY discovered_at DESC, id DESC`,
        )
        .all(domain) as ApiPattern[];
    }
    return this.memory?.getApiPatterns(domain) ?? [];
  }

  // ---- maintenance ----

  /** Delete every search/page row whose TTL has expired. */
  pruneExpired(): void {
    if (this.db !== null) {
      const now = Date.now();
      this.db
        .prepare("DELETE FROM search_cache WHERE created_at < ?")
        .run(now - SEARCH_TTL_MS);
      this.db
        .prepare("DELETE FROM page_cache WHERE created_at < ?")
        .run(now - PAGE_TTL_MS);
      return;
    }
    this.memory?.pruneExpired();
  }
}