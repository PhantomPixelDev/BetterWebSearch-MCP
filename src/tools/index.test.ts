import { existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { cacheFromConfig } from "./index.js";
import { loadConfig } from "../utils/config.js";

const ORIGINAL = { ...process.env };

/** A unique cache path per assertion, cleaned up with its WAL sidecars. */
function tempDbPath(label: string): string {
  return join(tmpdir(), `bws-${label}-${process.pid}-${Date.now()}.db`);
}

function removeDb(path: string): void {
  for (const suffix of ["", "-wal", "-shm"]) {
    if (existsSync(path + suffix)) {
      try {
        rmSync(path + suffix);
      } catch {
        // ignore lock race on Windows
      }
    }
  }
}

afterEach(() => {
  delete process.env.BETTER_WEB_SEARCH_DISABLE_CACHE;
  delete process.env.DISABLE_CACHE;
  delete process.env.BETTER_WEB_SEARCH_CACHE_PATH;
  delete process.env.CACHE_PATH;
  Object.assign(process.env, ORIGINAL);
});

describe("cacheFromConfig", () => {
  it("uses the in-memory backend when the cache is disabled", () => {
    process.env.BETTER_WEB_SEARCH_DISABLE_CACHE = "true";

    const cache = cacheFromConfig(loadConfig());

    // Before this wiring the flag only changed the banner text; the server
    // still opened data/cache.db on disk.
    expect(cache.isMemory).toBe(true);
    cache.close();
  });

  it("honors the bare DISABLE_CACHE alias", () => {
    process.env.DISABLE_CACHE = "true";

    const cache = cacheFromConfig(loadConfig());

    expect(cache.isMemory).toBe(true);
    cache.close();
  });

  it("opens the database at the configured cache path", () => {
    const dbPath = tempDbPath("configured");
    removeDb(dbPath);
    process.env.BETTER_WEB_SEARCH_CACHE_PATH = dbPath;

    const cache = cacheFromConfig(loadConfig());

    try {
      expect(cache.isMemory).toBe(false);
      cache.setSearch("k", "query", { hit: true });
      expect(existsSync(dbPath)).toBe(true);
    } finally {
      cache.close();
      removeDb(dbPath);
    }
  });

  it("round-trips through the configured database, not the default path", () => {
    const dbPath = tempDbPath("roundtrip");
    removeDb(dbPath);
    process.env.BETTER_WEB_SEARCH_CACHE_PATH = dbPath;

    const writer = cacheFromConfig(loadConfig());
    writer.setSearch("shared", "query", { value: 42 });
    writer.close();

    const reader = cacheFromConfig(loadConfig());
    try {
      expect(reader.getSearch("shared")).toEqual({ value: 42 });
    } finally {
      reader.close();
      removeDb(dbPath);
    }
  });
});
