---
title: "Quickstart"
description: "Get BetterWebSearch MCP running in 30 seconds — zero config, no API keys needed."
weight: 10
---

BetterWebSearch works out of the box with **DuckDuckGo** — no API keys, no `.env`, no configuration.

## Option 1: npx (recommended)

```bash
npx -y better-web-search-mcp --help   # keyless — DuckDuckGo works immediately
npx -y better-web-search-mcp          # start MCP stdio server
```

Or install globally:

```bash
npm i -g better-web-search-mcp
better-web-search-mcp --help
better-web-search-mcp --version
```

## Option 2: From source (30s)

```bash
git clone https://github.com/PhantomPixelDev/BetterWebSearch-MCP.git
cd BetterWebSearch-MCP
npm install
npm run build
npx better-web-search-mcp --help
BRAVE_API_KEY= npx better-web-search-mcp   # still works, DuckDuckGo fallback
```

No `.env` required for the first test. The server boots, prints a provider banner to stderr, and every tool works.

## What you get

When the server starts, it prints a banner to stderr:

```
better-web-search-mcp v0.1.0
Providers (keyless-first):
  ✓ duckduckgo (keyless) — always on
  ✗ brave (api-key) — set BRAVE_API_KEY for better results
  ✗ tavily (api-key) — optional — set TAVILY_API_KEY
  ✗ serpapi (api-key) — stub — not yet implemented
Cache: data/cache.db
Browser: enabled (playwright, pool=3)
```

All 6 tools (`web_search`, `web_research`/`deep_search`, `web_extract`, `web_find`, `web_news`) work immediately via DuckDuckGo. Add `BRAVE_API_KEY` for richer ranking and recency filtering.

## Add to your MCP client

### Zero-config (recommended first test)

```json
{
  "mcpServers": {
    "better-web-search-mcp": {
      "command": "npx",
      "args": ["-y", "better-web-search-mcp"]
    }
  }
}
```

### With Brave (better ranking & recency)

```json
{
  "mcpServers": {
    "better-web-search-mcp": {
      "command": "npx",
      "args": ["-y", "better-web-search-mcp"],
      "env": { "BRAVE_API_KEY": "BSA...your key" }
    }
  }
}
```

### Claude Code CLI

```bash
claude mcp add better-web-search-mcp -- npx -y better-web-search-mcp
claude mcp add better-web-search-mcp --env BRAVE_API_KEY=... -- npx -y better-web-search-mcp
```

## Next steps

- [Configuration](/docs/configuration/) — Add API keys and tweak settings
- [Tools Reference](/docs/tools/) — Learn about all 6 tools
- [Providers](/docs/providers/) — Understand the search provider abstraction
