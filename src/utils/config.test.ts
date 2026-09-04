import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { defaultCachePath, loadConfig, formatBanner, providerStatuses } from "./config.js";

const ORIGINAL = { ...process.env };

function clearKeys() {
  delete process.env.BRAVE_API_KEY;
  delete process.env.TAVILY_API_KEY;
  delete process.env.SERPAPI_KEY;
  delete process.env.BETTER_WEB_SEARCH_BRAVE_API_KEY;
  delete process.env.BETTER_WEB_SEARCH_TAVILY_API_KEY;
  delete process.env.BETTER_WEB_SEARCH_SERPAPI_KEY;
  delete process.env.BETTER_WEB_SEARCH_DISABLE_CACHE;
  delete process.env.BETTER_WEB_SEARCH_CACHE_PATH;
}

beforeEach(clearKeys);
afterEach(() => {
  clearKeys();
  Object.assign(process.env, ORIGINAL);
});

describe("loadConfig", () => {
  it("prefers BRAVE_API_KEY over namespaced alias", () => {
    process.env.BRAVE_API_KEY = "bare";
    process.env.BETTER_WEB_SEARCH_BRAVE_API_KEY = "namespaced";
    expect(loadConfig().braveApiKey).toBe("bare");
  });

  it("falls back to BETTER_WEB_SEARCH_BRAVE_API_KEY", () => {
    process.env.BETTER_WEB_SEARCH_BRAVE_API_KEY = "fallback";
    expect(loadConfig().braveApiKey).toBe("fallback");
  });

  it("keyless when no keys set", () => {
    const cfg = loadConfig();
    expect(cfg.braveApiKey).toBeUndefined();
    expect(cfg.tavilyApiKey).toBeUndefined();
  });

  it("cache enabled by default", () => {
    expect(loadConfig().cacheEnabled).toBe(true);
  });

  it("formatBanner mentions keyless hint", () => {
    const cfg = loadConfig();
    const banner = formatBanner({ name: "better-web-search-mcp", version: "0.1.0" }, cfg);
    expect(banner).toContain("duckduckgo");
    expect(banner).toContain("keyless");
    expect(banner).toContain("BRAVE_API_KEY");
  });

  it("providerStatuses includes duckduckgo always enabled", () => {
    const cfg = loadConfig();
    const statuses = providerStatuses(cfg);
    const ddg = statuses.find((p) => p.name === "duckduckgo");
    expect(ddg?.enabled).toBe(true);
    expect(ddg?.keyless).toBe(true);
  });
});

describe("defaultCachePath", () => {
  /** Compare on path segments so the host separator does not matter. */
  const segments = (p: string): string[] =>
    p.split(/[\\/]+/).filter((part) => part !== "" && !part.endsWith(":"));

  it("uses LOCALAPPDATA on Windows", () => {
    const p = defaultCachePath({ LOCALAPPDATA: "C:/Users/x/AppData/Local" }, "win32");
    expect(segments(p).slice(-2)).toEqual(["better-web-search-mcp", "cache.db"]);
    expect(segments(p)).toContain("Local");
  });

  it("derives the Windows path from the profile when LOCALAPPDATA is absent", () => {
    const p = defaultCachePath({ USERPROFILE: "C:/Users/x" }, "win32");
    expect(segments(p)).toEqual(
      expect.arrayContaining(["AppData", "Local", "better-web-search-mcp"]),
    );
  });

  it("uses Library/Caches on macOS", () => {
    const p = defaultCachePath({ HOME: "/Users/x" }, "darwin");
    expect(segments(p)).toEqual(
      expect.arrayContaining(["Library", "Caches", "better-web-search-mcp"]),
    );
  });

  it("honours XDG_CACHE_HOME on Linux", () => {
    const p = defaultCachePath({ XDG_CACHE_HOME: "/home/x/.cache" }, "linux");
    expect(segments(p).slice(-3)).toEqual([
      ".cache",
      "better-web-search-mcp",
      "cache.db",
    ]);
  });

  it("falls back to ~/.cache on Linux without XDG", () => {
    const p = defaultCachePath({ HOME: "/home/x" }, "linux");
    expect(segments(p)).toContain(".cache");
  });

  it("falls back to a relative path when there is no home directory", () => {
    // Better a working-directory cache than refusing to start.
    expect(segments(defaultCachePath({}, "linux"))).toEqual(["data", "cache.db"]);
  });

  it("is absolute on a normal machine, so the cache does not follow the cwd", () => {
    // A relative default scattered data/cache.db wherever a client launched
    // the server, and the domain profiles never accumulated.
    const p = defaultCachePath({ HOME: "/home/x" }, "linux");
    expect(segments(p).length).toBeGreaterThan(2);
  });
});
