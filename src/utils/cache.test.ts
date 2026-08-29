import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";

import { Cache, PAGE_TTL_MS, SEARCH_TTL_MS } from "./cache.js";

const DB_PATH = join(tmpdir(), `better-web-search-test-${process.pid}-${Date.now()}.db`);

/** Remove the DB file (and WAL sidecars) so tests start from a clean slate. */
function removeDbFile(): void {
  for (const suffix of ["", "-wal", "-shm"]) {
    const path = DB_PATH + suffix;
    if (existsSync(path)) {
      try {
        rmSync(path);
      } catch {
        // ignore lock race on Windows
      }
    }
  }
}

describe("Cache (SQLite backend)", () => {
  let cache: Cache;

  beforeAll(() => {
    removeDbFile();
    cache = new Cache({ dbPath: DB_PATH });
  });

  afterAll(() => {
    cache.close();
    removeDbFile();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("setSearch then getSearch returns parsed results within TTL", () => {
    const results = [
      { title: "A", url: "https://a.example", snippet: "s", source: "test" },
    ];
    cache.setSearch("sqlite-hit", "query a", results);

    expect(cache.getSearch("sqlite-hit")).toEqual(results);
  });

  it("getSearch misses after the 15-minute TTL", () => {
    const nowSpy = vi.spyOn(Date, "now");
    nowSpy.mockReturnValue(1_000_000_000_000);
    cache.setSearch("sqlite-ttl", "query b", [{ title: "B" }]);

    nowSpy.mockReturnValue(1_000_000_000_000 + SEARCH_TTL_MS + 1);

    expect(cache.getSearch("sqlite-ttl")).toBeNull();
  });

  it("getSearch returns null for an unknown key", () => {
    expect(cache.getSearch("sqlite-missing")).toBeNull();
  });

  it("page_cache roundtrip within TTL", () => {
    cache.setPage("https://example.com/article", "# Hello", "readability", 0.85);

    const entry = cache.getPage("https://example.com/article");

    expect(entry).not.toBeNull();
    expect(entry?.url).toBe("https://example.com/article");
    expect(entry?.content).toBe("# Hello");
    expect(entry?.extraction_method).toBe("readability");
    expect(entry?.confidence).toBe(0.85);
  });

  it("getPage misses after the 1-hour TTL", () => {
    const nowSpy = vi.spyOn(Date, "now");
    nowSpy.mockReturnValue(1_000_000_000_000);
    cache.setPage("https://example.com/ttl", "content", "readability", 0.5);

    nowSpy.mockReturnValue(1_000_000_000_000 + PAGE_TTL_MS + 1);

    expect(cache.getPage("https://example.com/ttl")).toBeNull();
  });

  it("addApiPattern then getApiPatterns returns patterns for the domain", () => {
    cache.addApiPattern(
      "api.example.com",
      "/api/products/*",
      "GET",
      "application/json",
    );
    cache.addApiPattern(
      "api.example.com",
      "/api/users/*",
      "POST",
      "application/json",
    );

    const patterns = cache.getApiPatterns("api.example.com");

    expect(patterns).toHaveLength(2);
    expect(patterns.map((p) => p.endpoint_pattern)).toEqual(
      expect.arrayContaining(["/api/products/*", "/api/users/*"]),
    );
    expect(patterns.every((p) => p.domain === "api.example.com")).toBe(true);
    expect(patterns.every((p) => p.id > 0)).toBe(true);
  });

  it("getApiPatterns returns an empty list for an unknown domain", () => {
    expect(cache.getApiPatterns("nobody.example")).toEqual([]);
  });

  it("setDomain upserts and getDomain returns the latest profile", () => {
    cache.setDomain("profile.example", { requires_js: false, framework: "unknown" });
    cache.setDomain("profile.example", { requires_js: true, framework: "Next.js" });

    expect(cache.getDomain("profile.example")).toEqual({
      requires_js: true,
      framework: "Next.js",
    });
  });

  it("getDomain returns null for an unknown domain", () => {
    expect(cache.getDomain("nobody.example")).toBeNull();
  });

  it("pruneExpired deletes expired search and page rows", () => {
    const nowSpy = vi.spyOn(Date, "now");
    nowSpy.mockReturnValue(1_000_000_000_000);
    cache.setSearch("sqlite-prune", "q", [{ title: "old" }]);
    cache.setPage("https://example.com/old", "old content", "readability", 0.5);

    nowSpy.mockReturnValue(1_000_000_000_000 + PAGE_TTL_MS + 1);
    cache.pruneExpired();

    expect(cache.getSearch("sqlite-prune")).toBeNull();
    expect(cache.getPage("https://example.com/old")).toBeNull();
  });

  it("handles invalid JSON in the results column gracefully", () => {
    const raw = new Database(DB_PATH);
    raw
      .prepare(
        "INSERT INTO search_cache (key, query, results, created_at) VALUES (?, ?, ?, ?)",
      )
      .run("sqlite-corrupt", "q", "{not json", Date.now());
    raw.close();

    expect(cache.getSearch("sqlite-corrupt")).toBeNull();
  });

  it("handles invalid JSON in the profile column gracefully", () => {
    const raw = new Database(DB_PATH);
    raw
      .prepare(
        "INSERT INTO domain_profiles (domain, profile, updated_at) VALUES (?, ?, ?)",
      )
      .run("corrupt.example", "{broken", Date.now());
    raw.close();

    expect(cache.getDomain("corrupt.example")).toBeNull();
  });
});

describe("Cache (memory fallback)", () => {
  let cache: Cache;

  beforeEach(() => {
    cache = new Cache({ memory: true });
  });

  afterEach(() => {
    cache.close();
    vi.restoreAllMocks();
  });

  it("reports the in-memory backend", () => {
    expect(cache.isMemory).toBe(true);
  });

  it("setSearch then getSearch roundtrips", () => {
    cache.setSearch("mem-hit", "q", [{ title: "A" }]);

    expect(cache.getSearch("mem-hit")).toEqual([{ title: "A" }]);
  });

  it("getSearch misses after the 15-minute TTL", () => {
    const nowSpy = vi.spyOn(Date, "now");
    nowSpy.mockReturnValue(1_000_000_000_000);
    cache.setSearch("mem-ttl", "q", [{ title: "A" }]);

    nowSpy.mockReturnValue(1_000_000_000_000 + SEARCH_TTL_MS + 1);

    expect(cache.getSearch("mem-ttl")).toBeNull();
  });

  it("page_cache roundtrips", () => {
    cache.setPage("https://example.com/mem", "content", "readability", 0.9);

    const entry = cache.getPage("https://example.com/mem");

    expect(entry?.content).toBe("content");
    expect(entry?.extraction_method).toBe("readability");
    expect(entry?.confidence).toBe(0.9);
  });

  it("api_patterns insert and get by domain", () => {
    cache.addApiPattern("mem.example", "/api/x", "GET", "application/json");
    cache.addApiPattern("mem.example", "/api/y", "GET", "application/json");

    const patterns = cache.getApiPatterns("mem.example");

    expect(patterns).toHaveLength(2);
    expect(patterns.map((p) => p.endpoint_pattern)).toEqual([
      "/api/y",
      "/api/x",
    ]);
  });

  it("domain_profiles upsert", () => {
    cache.setDomain("mem.example", { a: 1 });
    cache.setDomain("mem.example", { a: 2 });

    expect(cache.getDomain("mem.example")).toEqual({ a: 2 });
  });

  it("pruneExpired clears expired entries", () => {
    const nowSpy = vi.spyOn(Date, "now");
    nowSpy.mockReturnValue(1_000_000_000_000);
    cache.setSearch("mem-prune", "q", [{ title: "A" }]);

    nowSpy.mockReturnValue(1_000_000_000_000 + SEARCH_TTL_MS + 1);
    cache.pruneExpired();

    expect(cache.getSearch("mem-prune")).toBeNull();
  });
});