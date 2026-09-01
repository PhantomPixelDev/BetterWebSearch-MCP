---
title: "BetterWebSearch MCP"
description: "Keyless-first web search MCP server for AI agents — no API keys required."
---

<p align="center"><img src="images/banner.jpg" alt="BetterWebSearch MCP" width="100%"></p>

> **Keyless-first.** Works out of the box with **DuckDuckGo** — no API keys. Add `BRAVE_API_KEY` later for richer ranking & recency.

A local [Model Context Protocol](https://modelcontextprotocol.io) server that gives AI agents genuinely better web research: multi-provider search, three-tier page extraction, and deep research — without locking you into a single search API.

## Quick start (30 seconds)

Add this to your MCP client config (Claude Desktop, Cursor, VS Code Copilot, OpenCode, or any MCP client):

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

That's it. Every search tool works immediately. No `.env`, no API keys, no setup.

## What makes it better

- **Search Better** — Aggregated search across DuckDuckGo, Brave, and Tavily — deduplicated, reranked, and query-expanded for better coverage.
- **Extract Smarter** — Three-tier extraction pipeline: fast HTTP, structured data hydration, then full Playwright browser render — only escalates when needed.
- **Deep Research** — Rewrites your question into multiple variants, searches in parallel, extracts top results with citations and confidence scores.

## Documentation

- [Quickstart](/docs/quickstart/) — Get running in 30 seconds
- [Installation](/docs/installation/) — From source and npx
- [Tools Reference](/docs/tools/) — All 6 tools with input schemas
- [Configuration](/docs/configuration/) — Environment variables
- [Providers](/docs/providers/) — Brave, Tavily, DuckDuckGo
- [Extraction](/docs/extraction/) — 3-tier page extraction pipeline
- [Architecture](/docs/architecture/) — System design overview
- [Changelog](/docs/changelog/) — Release history
- [Contributing](/docs/contributing/) — How to help
