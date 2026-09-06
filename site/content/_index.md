---
title: "BetterWebSearch MCP"
description: "Free web search MCP server for AI agents — keyless DuckDuckGo out of the box, optional Brave and Tavily, three-tier page extraction and cited deep research."
---

<p align="center"><img src="images/banner.jpg" alt="BetterWebSearch MCP — smarter web search, better data extraction, flexible and extensible, open source" width="100%"></p>

> **Keyless-first.** Works out of the box with **DuckDuckGo** — no API keys. Add `BRAVE_API_KEY` later for richer ranking & recency.

**BetterWebSearch MCP** is a local [Model Context Protocol](https://modelcontextprotocol.io) server that gives AI agents genuinely better web research: multi-provider **web search**, three-tier **page extraction**, and **deep research with citations** — without locking you into a single search API and without an API key to get started.

{{< npm-stats >}}

## Quick start (30 seconds)

Add this to your MCP client config (Claude Desktop, Claude Code, Cursor, VS Code Copilot, OpenCode, or any MCP client):

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
- **Cheaper Context** — Doing the reading inside the server rather than pasting pages into the model cuts payload by [86.5% on the shipped benchmark](/docs/benchmarks/), while keeping 97.1% of the answers.

## The six tools

| Tool | What it does |
|---|---|
| `web_search` | Aggregated search across providers, deduplicated and reranked |
| `web_research` | Deep research: rewrites the question, searches in parallel, extracts with citations |
| `deep_search` | Alias for `web_research` |
| `web_extract` | Clean content from any URL, using the cheapest method that works |
| `web_find` | Search scoped to a single website |
| `web_news` | Recent news with a timeline and domain diversity |

## Works with

Any MCP client speaking stdio — including Claude Desktop, Claude Code, Cursor,
VS Code Copilot, Windsurf, Cline, Zed and OpenCode. See the
[quickstart](/docs/quickstart/) for per-client config snippets.

## Frequently asked

### Do I need an API key for web search?

No. DuckDuckGo is the default provider and needs no key, no account and no
billing. `BRAVE_API_KEY` or `TAVILY_API_KEY` are optional and add publication
dates and stronger ranking.

### Is it free?

Yes — MIT licensed, and the default provider costs nothing to query.

### How is it different from other web search MCP servers?

Most wrap a single search API and hand raw results back. This one aggregates
providers, expands the query into variants, escalates extraction only as far as
a page demands, clusters near-duplicate sources so a syndicated wire story is
not mistaken for five independent confirmations, and returns cited passages
instead of whole pages.

### Does it run in the cloud?

No. It runs locally over stdio, next to your client. Nothing is proxied through
a third-party service.

## Documentation

- [Quickstart](/docs/quickstart/) — Get running in 30 seconds
- [Installation](/docs/installation/) — From source and npx
- [Tools Reference](/docs/tools/) — All 6 tools with input schemas
- [Configuration](/docs/configuration/) — Environment variables
- [Providers](/docs/providers/) — Brave, Tavily, DuckDuckGo
- [Extraction](/docs/extraction/) — 3-tier page extraction pipeline
- [Benchmarks](/docs/benchmarks/) — Token efficiency and answer retention
- [Architecture](/docs/architecture/) — System design overview
- [Changelog](/docs/changelog/) — Release history
- [Contributing](/docs/contributing/) — How to help
