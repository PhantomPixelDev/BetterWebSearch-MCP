import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { Cache } from "../utils/cache.js";
import { loadConfig, type AppConfig } from "../utils/config.js";
import { registerSearch } from "./search.js";
import { registerExtract } from "./extract.js";
import { registerFind } from "./find.js";
import { registerNews } from "./news.js";
import { registerResearch } from "./research.js";

/**
 * Registers all MCP tools on the given server.
 *
 * Each tool module exposes a `register*` function that wires its zod schema
 * and handler onto the server. A shared cache instance is passed through so
 * search/news/find results are cached across calls.
 */

/**
 * Build the shared cache from configuration.
 *
 * `BETTER_WEB_SEARCH_DISABLE_CACHE` and `BETTER_WEB_SEARCH_CACHE_PATH` were
 * parsed by the config loader and printed in the startup banner, but nothing
 * ever passed them to the Cache: the server opened `data/cache.db` no matter
 * what either said. Both are honored here.
 */
export function cacheFromConfig(cfg: AppConfig = loadConfig()): Cache {
  if (!cfg.cacheEnabled) {
    return new Cache({ memory: true });
  }
  return new Cache({ dbPath: cfg.cachePath });
}

export function registerTools(server: McpServer, cache?: Cache): void {
  const sharedCache = cache ?? cacheFromConfig();
  registerSearch(server, sharedCache);
  registerExtract(server, sharedCache);
  registerFind(server, sharedCache);
  registerNews(server, sharedCache);
  registerResearch(server, sharedCache);
}
