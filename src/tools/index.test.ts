import { afterEach, describe, expect, it } from "vitest";

import { cacheFromConfig } from "./index.js";
import { loadConfig } from "../utils/config.js";

/**
 * These cover only the in-memory paths on purpose.
 *
 * better-sqlite3 is a native addon, and vitest tears down the addon's N-API
 * environment between test *files*. A database still open when that happens
 * aborts the runner with `Assertion failed: (env) != nullptr`, which showed up
 * as intermittent "Worker exited unexpectedly" CI failures. Real databases are
 * therefore opened from exactly one file, `utils/cache.test.ts`, which owns
 * the teardown — including the tests that a configured cache path is honored.
 */

const ORIGINAL = { ...process.env };

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

  it("still serves reads and writes while the cache is disabled", () => {
    process.env.BETTER_WEB_SEARCH_DISABLE_CACHE = "true";

    const cache = cacheFromConfig(loadConfig());
    try {
      cache.setSearch("k", "query", { hit: true });
      expect(cache.getSearch("k")).toEqual({ hit: true });
    } finally {
      cache.close();
    }
  });

  it("reads the cache path from configuration", () => {
    process.env.BETTER_WEB_SEARCH_CACHE_PATH = "custom/path/cache.db";

    // Asserted without opening the database; utils/cache.test.ts covers the
    // round trip through a real file.
    expect(loadConfig().cachePath).toBe("custom/path/cache.db");
  });
});
