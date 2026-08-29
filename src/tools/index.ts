import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { Cache } from "../utils/cache.js";
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
export function registerTools(server: McpServer, cache?: Cache): void {
  const sharedCache = cache ?? new Cache();
  registerSearch(server, sharedCache);
  registerExtract(server, sharedCache);
  registerFind(server, sharedCache);
  registerNews(server, sharedCache);
  registerResearch(server, sharedCache);
}
