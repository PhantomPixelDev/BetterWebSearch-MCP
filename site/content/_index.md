---
title: "BetterWebSearch MCP"
description: "Keyless-first MCP for better web research"
---

# BetterWebSearch MCP

> **Keyless-first.** Works out of the box with **DuckDuckGo** — no API keys. Add `BRAVE_API_KEY` later for richer ranking & recency.

A local [Model Context Protocol](https://modelcontextprotocol.io) server that gives AI agents genuinely better web research: multi-provider search, three-tier page extraction, and deep research — without locking you into a single search API.

## Quick Start

```bash
npx -y better-web-search-mcp          # start MCP stdio server
npx -y better-web-search-mcp --help   # print usage + env + examples
```

No `.env` required. DuckDuckGo works immediately.

## Tools

| Tool | What it does | Keyless? |
|---|---|---|
| `web_search` | Fast search (aggregated, deduped, reranked) | ✓ |
| `web_research` | Deep research with citations | ✓ |
| `web_extract` | 3-tier extraction (HTTP → hydration → browser) | ✓ |
| `web_find` | `site:` scoped search | ✓ |
| `web_news` | Recent news + timeline | ✓ |

## Learn More

- [Quickstart](/docs/quickstart/)
- [Installation](/docs/installation/)
- [Tools Reference](/docs/tools/)
- [Configuration](/docs/configuration/)
