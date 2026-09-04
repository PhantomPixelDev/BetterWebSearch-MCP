/**
 * Central config loader — keyless-first, nice missing-key hints.
 *
 * All keys are optional. When BRAVE_API_KEY etc. are absent we run in keyless
 * mode (DuckDuckGo only) and print a friendly hint to stderr so users know how
 * to upgrade. Also supports the BETTER_WEB_SEARCH_* prefix for namespacing
 * (e.g. BETTER_WEB_SEARCH_BRAVE_API_KEY) as an alias for the bare name.
 */

import { join } from "node:path";

const KEY_ALIASES: Record<string, string[]> = {
  BRAVE_API_KEY: ["BETTER_WEB_SEARCH_BRAVE_API_KEY", "BRAVE_SEARCH_API_KEY"],
  TAVILY_API_KEY: ["BETTER_WEB_SEARCH_TAVILY_API_KEY"],
  SERPAPI_KEY: ["BETTER_WEB_SEARCH_SERPAPI_KEY", "SERP_API_KEY"],
};

function pickFirstEnv(names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (value !== undefined && value.trim() !== "") {
      return value.trim();
    }
  }
  return undefined;
}

function readKey(canonical: string): string | undefined {
  const aliases = KEY_ALIASES[canonical] ?? [];
  return pickFirstEnv([canonical, ...aliases]);
}

export interface AppConfig {
  braveApiKey: string | undefined;
  tavilyApiKey: string | undefined;
  serpApiKey: string | undefined;
  cacheEnabled: boolean;
  cachePath: string;
  browserEnabled: boolean;
}

/**
 * Where the cache lives when nothing overrides it.
 *
 * The default used to be the relative path `data/cache.db`, which resolves
 * against the working directory. An MCP client spawns the server from
 * wherever it happens to be, so that scattered `data/cache.db` files around
 * the filesystem — two were sitting in the home and Downloads folders — and
 * meant the domain profiles and page cache never accumulated, because every
 * launch directory got its own empty database. A per-user location is stable
 * across launches and keeps the writes inside a directory meant for them.
 *
 * `BETTER_WEB_SEARCH_CACHE_PATH` still overrides, and a relative override is
 * still honoured for anyone who wants a project-local cache.
 */
export function defaultCachePath(
  env: NodeJS.ProcessEnv = process.env,
  platform: string = process.platform,
): string {
  const home = env.HOME ?? env.USERPROFILE;
  const app = "better-web-search-mcp";

  if (platform === "win32") {
    const base = env.LOCALAPPDATA ?? (home ? join(home, "AppData", "Local") : undefined);
    if (base) {
      return join(base, app, "cache.db");
    }
  } else if (platform === "darwin") {
    if (home) {
      return join(home, "Library", "Caches", app, "cache.db");
    }
  } else {
    const base = env.XDG_CACHE_HOME ?? (home ? join(home, ".cache") : undefined);
    if (base) {
      return join(base, app, "cache.db");
    }
  }

  // No home directory to write into: fall back to the old relative path
  // rather than failing to start.
  return join("data", "cache.db");
}

export function loadConfig(): AppConfig {
  const braveApiKey = readKey("BRAVE_API_KEY");
  const tavilyApiKey = readKey("TAVILY_API_KEY");
  const serpApiKey = readKey("SERPAPI_KEY");

  const cacheEnabled =
    (process.env.BETTER_WEB_SEARCH_DISABLE_CACHE ?? "").toLowerCase() !== "true" &&
    (process.env.DISABLE_CACHE ?? "").toLowerCase() !== "true";

  const cachePath =
    process.env.BETTER_WEB_SEARCH_CACHE_PATH ??
    process.env.CACHE_PATH ??
    defaultCachePath();

  const browserEnabled =
    (process.env.BETTER_WEB_SEARCH_DISABLE_BROWSER ?? "").toLowerCase() !== "true" &&
    (process.env.DISABLE_BROWSER ?? "").toLowerCase() !== "true";

  return {
    braveApiKey,
    tavilyApiKey,
    serpApiKey,
    cacheEnabled,
    cachePath,
    browserEnabled,
  };
}

/** Shape for the provider banner (pure, testable). */
export interface ProviderStatus {
  name: string;
  enabled: boolean;
  keyless: boolean;
  hint?: string;
}

export function providerStatuses(cfg: AppConfig): ProviderStatus[] {
  return [
    {
      name: "duckduckgo",
      enabled: true,
      keyless: true,
      hint: "always on",
    },
    {
      name: "brave",
      enabled: cfg.braveApiKey !== undefined,
      keyless: false,
      hint: cfg.braveApiKey ? "enabled" : "set BRAVE_API_KEY for better results",
    },
    {
      name: "tavily",
      enabled: cfg.tavilyApiKey !== undefined,
      keyless: false,
      hint: cfg.tavilyApiKey ? "enabled" : "optional — set TAVILY_API_KEY",
    },
  ];
}

export function formatBanner(
  pkg: { name: string; version: string },
  cfg: AppConfig,
): string {
  const providers = providerStatuses(cfg);
  const line = (p: ProviderStatus): string => {
    const mark = p.enabled ? "✓" : "✗";
    const tag = p.keyless ? "keyless" : p.enabled ? "api-key" : "api-key";
    return `  ${mark} ${p.name} (${tag})${p.hint ? ` — ${p.hint}` : ""}`;
  };
  return [
    `${pkg.name} v${pkg.version}`,
    "Providers (keyless-first):",
    ...providers.map(line),
    `Cache: ${cfg.cacheEnabled ? cfg.cachePath : "disabled (memory fallback)"}`,
    `Browser: ${cfg.browserEnabled ? "enabled (playwright, pool=3)" : "disabled"}`,
    "Tools: web_search, web_research/deep_search, web_extract, web_find, web_news",
    "Tip: run with no keys — DuckDuckGo works out of the box. Add BRAVE_API_KEY for richer ranking & recency.",
  ].join("\n");
}
