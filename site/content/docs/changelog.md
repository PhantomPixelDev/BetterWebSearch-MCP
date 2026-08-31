---
title: "Changelog"
description: "Release history for BetterWebSearch MCP following Keep a Changelog format."
weight: 90
---

# Changelog

All notable changes to **better-web-search-mcp** are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-29

### Added
- Initial public release — keyless-first MCP server for web research
- Multi-provider search abstraction: Brave (primary), Tavily (optional), DuckDuckGo (keyless fallback), SerpApi stub — aggregated via `Promise.allSettled`, deduplicated and reranked
- Query expansion: 4–6 parallel variants incl. German translations (e.g. `unlimited mobile internet Germany` → `unbegrenztes Datenvolumen`)
- Ranking pipeline: `normalizeUrl` (utm/gclid/fbclid strip, trailing slash, hash), `domainScore` curated tiers, `rerank` (0.5 overlap +0.2 domain +0.2 recency +0.1 score)
- 3-tier extraction: Level 1 `fetchPage` (10s, 2MB cap, UA) → Level 2 `JSON-LD / __NEXT_DATA__ / self.__next_f / __NUXT__ / __APOLLO_STATE__` → Level 3 Playwright pool (3, image/font/media block, intelligent Race `networkidle`/`article`/`innerText>1000`, `page.on('response')` JSON capture)
- Content Fusion with confidence scores (`api 0.99` > `jsonld 0.95` > `rendered 0.90` > `readability 0.85`)
- Alternative source discovery: AMP variants `?output=1 /amp` + quoted-title `site:` searches, snippet evidence `search_snippet 0.6`
- SQLite cache (`better-sqlite3` WAL, `data/cache.db`) + in-memory fallback — `search_cache` 15min, `page_cache` 1h, `api_patterns`, `domain_profiles` — `domainProfile` self-learning per domain
- 6 MCP tools: `web_search`, `web_research`/`deep_search` (parallel queries, bounded concurrency 3, 8s per page, extractive citations), `web_extract` (auto/fast/browser), `web_find`, `web_news` (recency + timeline + diversity)
- Central `config` loader: `BRAVE_API_KEY` + `BETTER_WEB_SEARCH_BRAVE_API_KEY` aliases, cache/browser toggles, keyless hint banner to stderr
- CLI: `--help` / `--version` (exit before MCP handshake), startup banner listing providers
- OpenCode / Claude / Cursor / VS Code configs: `mcp.json`, `.vscode/mcp.json`, `smithery.yaml`
- 195 tests (vitest), `tsc` strict, `npm run build` emits `dist/`

### Notes
- No API keys required for first test — `npx better-web-search-mcp` works via DuckDuckGo
- Add `BRAVE_API_KEY` for richer ranking & recency filtering
- Publish-ready: `npm pack --dry-run` validated, `prepare`/`prepublishOnly` hooks, `files` whitelist

[0.1.0]: https://github.com/PhantomPixelDev/BetterWebSearch-MCP/releases/tag/v0.1.0
