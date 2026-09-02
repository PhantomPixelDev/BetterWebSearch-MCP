---
title: "Configuration"
description: "All environment variables are optional. DuckDuckGo works without any keys."
weight: 25
---

**All environment variables are optional.** The server starts and works via DuckDuckGo when no keys are set. Create a `.env` only if you want additional providers.

```bash
cp .env.example .env  # then edit
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `BRAVE_API_KEY` or `BETTER_WEB_SEARCH_BRAVE_API_KEY` | no | Brave Search API key (primary). [Get one](https://brave.com/search/api/) |
| `TAVILY_API_KEY` or `BETTER_WEB_SEARCH_TAVILY_API_KEY` | no | Tavily key. [tavily.com](https://tavily.com/) |
| `BETTER_WEB_SEARCH_DISABLE_CACHE` | no | `true` → in-memory fallback (no SQLite) |
| `BETTER_WEB_SEARCH_CACHE_PATH` | no | Custom SQLite path (default `data/cache.db`) |
| `BETTER_WEB_SEARCH_DISABLE_BROWSER` | no | `true` → skip Playwright fallback |

## Key aliases

The config loader supports both the bare name and the `BETTER_WEB_SEARCH_*` prefix:

| Canonical | Aliases |
|---|---|
| `BRAVE_API_KEY` | `BETTER_WEB_SEARCH_BRAVE_API_KEY`, `BRAVE_SEARCH_API_KEY` |
| `TAVILY_API_KEY` | `BETTER_WEB_SEARCH_TAVILY_API_KEY` |

The first non-empty value found wins (checked in the order listed above).

## Cache settings

| Variable | Default | Description |
|---|---|---|
| `BETTER_WEB_SEARCH_DISABLE_CACHE` | `false` | Set `true` to disable SQLite cache entirely |
| `DISABLE_CACHE` | `false` | Alias for the above |
| `BETTER_WEB_SEARCH_CACHE_PATH` | `data/cache.db` | Path to SQLite cache file |
| `CACHE_PATH` | — | Alias for the above |

Cache TTLs:
- Search results: 15 minutes
- Page content: 1 hour
- Domain profiles and API patterns: permanent (self-learning)

Expired rows are pruned automatically on startup.

## Browser settings

| Variable | Default | Description |
|---|---|---|
| `BETTER_WEB_SEARCH_DISABLE_BROWSER` | `false` | Set `true` to skip Playwright browser fallback entirely |
| `DISABLE_BROWSER` | `false` | Alias for the above |

The Playwright browser pool uses up to 3 concurrent instances, blocks images/fonts/media for speed, and uses an intelligent race between `networkidle`, `article` detection, and `innerText > 1000` to determine when a page is loaded.

## Server banner

When the server starts, it prints a provider status banner to stderr:

```
better-web-search-mcp v0.2.3
Providers (keyless-first):
  ✓ duckduckgo (keyless) — always on
  ✗ brave (api-key) — set BRAVE_API_KEY for better results
  ✗ tavily (api-key) — optional — set TAVILY_API_KEY
Cache: data/cache.db
Browser: enabled (playwright, pool=3)
```

## Example `.env`

```bash
# BetterWebSearch MCP - environment configuration
# All keys are optional; the server starts and falls back to
# keyless providers (DuckDuckGo) when absent.

# Brave Search API key (primary provider).
# Get one at https://brave.com/search/api/
BRAVE_API_KEY=

# Tavily Search API key (optional).
# https://tavily.com/
TAVILY_API_KEY=

# SerpApi key (optional, reserved for a future provider).
# https://serpapi.com/
SERPAPI_KEY=
```
