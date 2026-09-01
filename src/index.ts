#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { closeSharedBrowserPool } from "./extraction/router.js";
import { registerTools } from "./tools/index.js";
import { formatBanner, loadConfig } from "./utils/config.js";

const currentDir = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(join(currentDir, "..", "package.json"), "utf8"),
) as { name: string; version: string };

function printHelp(): void {
  const help = `${pkg.name} v${pkg.version} — BetterWebSearch MCP
A self-learning web-access engine for AI agents. Keyless by default via DuckDuckGo.

Usage:
  better-web-search-mcp [--help] [--version]

Tools (6):
  web_search     Fast search (keyless by default, Brave/Tavily if keys present)
  web_research   Deep multi-query research (rewrites question, ranks, extracts)
  deep_search    Alias for web_research
  web_extract    Clean article extraction (HTTP → hydration → browser)
  web_find       Site-restricted search (site:example.com query)
  web_news       Recent news with timeline & source diversity

Env (all optional — keyless works out of the box):
  BRAVE_API_KEY / BETTER_WEB_SEARCH_BRAVE_API_KEY   Brave Search API key
  TAVILY_API_KEY / BETTER_WEB_SEARCH_TAVILY_API_KEY Tavily API key
  BETTER_WEB_SEARCH_DISABLE_CACHE=true              Disable SQLite cache
  BETTER_WEB_SEARCH_CACHE_PATH=./data/cache.db      Custom cache path
  BETTER_WEB_SEARCH_DISABLE_BROWSER=true            Disable Playwright fallback

Examples:
  npx better-web-search-mcp                         # keyless (DuckDuckGo)
  BRAVE_API_KEY=... npx better-web-search-mcp       # with Brave
  better-web-search-mcp --help
  better-web-search-mcp --version

MCP config (Claude Desktop / Cursor / VS Code Copilot):
  {"mcpServers":{"better-web-search-mcp":{"command":"npx","args":["-y","better-web-search-mcp"]}}}
  With Brave: {"mcpServers":{"better-web-search-mcp":{"command":"npx","args":["-y","better-web-search-mcp"],"env":{"BRAVE_API_KEY":"..."}}}}

See README.md and mcp.json for full client examples.
`;
  process.stdout.write(help);
}

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  printHelp();
  process.exit(0);
}
if (args.includes("--version") || args.includes("-v")) {
  process.stdout.write(`${pkg.version}\n`);
  process.exit(0);
}

const server = new McpServer({
  name: pkg.name,
  version: pkg.version,
});

registerTools(server);

/**
 * Shut down cleanly on a signal.
 *
 * The router launches chromium lazily for its Level 3 tier, so an abrupt
 * exit would orphan that browser process. Guarded so a second signal during
 * teardown does not re-enter.
 */
let shuttingDown = false;
function installShutdownHandlers(): void {
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => {
      if (shuttingDown) {
        return;
      }
      shuttingDown = true;
      void closeSharedBrowserPool()
        .catch(() => {})
        .finally(() => process.exit(0));
    });
  }
}

async function main(): Promise<void> {
  const cfg = loadConfig();
  console.error(formatBanner(pkg, cfg));
  installShutdownHandlers();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  console.error("Fatal error starting better-web-search-mcp:", error);
  process.exit(1);
});
