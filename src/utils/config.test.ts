import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, formatBanner, providerStatuses } from "./config.js";

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
