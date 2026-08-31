---
title: "Documentation"
description: "Learn how to install, configure, and use BetterWebSearch MCP — the keyless-first web research server for AI agents."
weight: 1
---

> **Keyless-first.** Works out of the box with **DuckDuckGo** — no API keys. Add `BRAVE_API_KEY` later for richer ranking & recency.

A local [Model Context Protocol](https://modelcontextprotocol.io) server that gives AI agents genuinely better web research: multi-provider search, three-tier page extraction, and deep research — without locking you into a single search API.

## At a Glance

| | |
|---|---|
| **Install** | `npx -y better-web-search-mcp` |
| **Keys required** | None — DuckDuckGo works immediately |
| **Node** | 20+ |
| **License** | MIT |
| **npm** | [better-web-search-mcp](https://www.npmjs.com/package/better-web-search-mcp) |

## Tools

| Tool | What it does | Keyless? |
|---|---|---|
| `web_search` | Fast search (aggregated, deduped, reranked) | ✓ |
| `web_research` / `deep_search` | Deep research: rewrites question → parallel searches → top-10 extraction → citations | ✓ |
| `web_extract` | Clean extraction `HTTP → hydration → browser` with `confidence` & `api_endpoints` | ✓ |
| `web_find` | `site:` scoped search | ✓ |
| `web_news` | Recent news + timeline + diversity | ✓ |

## Learn More

- [Quickstart](/docs/quickstart/) — Get running in 30 seconds
- [Installation](/docs/installation/) — From source and npx
- [Tools Reference](/docs/tools/) — All 6 tools with input schemas
- [Configuration](/docs/configuration/) — Environment variables
- [Providers](/docs/providers/) — Brave, Tavily, DuckDuckGo
- [Extraction](/docs/extraction/) — 3-tier page extraction pipeline
- [Architecture](/docs/architecture/) — System design overview
- [Changelog](/docs/changelog/) — Release history
- [Contributing](/docs/contributing/) — How to help
