# BetterWebSearch MCP

> **Keyless-first.** Works out of the box with **DuckDuckGo** — no API keys. Add `BRAVE_API_KEY` later for richer ranking & recency. Zero-config, like every other great MCP.

A local [Model Context Protocol](https://modelcontextprotocol.io) server that gives AI agents genuinely better web research: multi-provider search, three-tier page extraction, and deep research — without locking you into a single search API.

[![npm version](https://img.shields.io/npm/v/better-web-search-mcp?color=cb3837)](https://www.npmjs.com/package/better-web-search-mcp)
[![npm downloads](https://img.shields.io/npm/dm/better-web-search-mcp)](https://www.npmjs.com/package/better-web-search-mcp)
[![Node >=20](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)
[![MCP](https://img.shields.io/badge/MCP-stdio-blue)](https://modelcontextprotocol.io)
[![CI](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/actions/workflows/ci.yml/badge.svg)](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Smithery](https://smithery.ai/badge/@PhantomPixelDev/better-web-search-mcp)](https://smithery.ai/server/@PhantomPixelDev/better-web-search-mcp)

## Install via npx (no install)

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

## Zero-config quick start from source (30s)

```bash
git clone https://github.com/PhantomPixelDev/BetterWebSearch-MCP.git
cd BetterWebSearch-MCP
npm install
npm run build
npx better-web-search-mcp --help
BRAVE_API_KEY= npx better-web-search-mcp   # still works, DuckDuckGo fallback
```

No `.env` required for the first test. The server boots, prints a provider banner to stderr, and every tool works.

## Tools

| Tool | What it does | Keyless? |
|---|---|---|
| `web_search` | Fast search (aggregated, deduped, reranked) | ✓ |
| `web_research` / `deep_search` | Deep research: rewrites question → parallel searches → top-10 extraction → citations | ✓ |
| `web_extract` | Clean extraction `HTTP → hydration → browser` with `confidence` & `api_endpoints` | ✓ |
| `web_find` | `site:` scoped search | ✓ |
| `web_news` | Recent news + timeline + diversity | ✓ |

All 6 entries (research has an alias) share the same keyless-first path.

## Why this MCP

- **Provider abstraction** — `SearchProvider` interface. DuckDuckGo is always on; Brave/Tavily/SERPApi are opt-in via env.
- **Query rewriting** — `unlimited mobile internet Germany` → 4–6 variants incl. `unbegrenztes Datenvolumen … Deutschland`, searched in parallel.
- **3-tier extraction** — `fetch` (<1s) → hidden `JSON-LD / __NEXT_DATA__ / self.__next_f / __NUXT__` (1–3s) → `Playwright` + `page.on('response')` JSON capture (3–10s). Only escalates when needed.
- **Self-learning** — `domain_profiles` + `api_patterns` cached in SQLite (`data/cache.db`) so the second visit to a domain skips the browser.
- **Evidence-typed** — every result carries `{method, confidence, type: page|api|structured_data|search_snippet}`.

## Install

```bash
npm install
npm run build
npm test            # 189+ tests, keyless suite
npx tsc --noEmit    # lint
```

Requirements: Node 20+ and npm.

> **Native binding note:** `better-sqlite3` needs a compiled native addon. If it fails to load (older Node, missing build tools, CI sandbox), the cache automatically falls back to an in-memory Map — no action needed. To restore the SQLite cache, run `npm rebuild better-sqlite3` (Node 20+ recommended).

## Configuration — all env vars optional

Create `.env` only if you want more than DuckDuckGo:

```bash
cp .env.example .env  # then edit
```

| Variable | Required | Description |
|---|---|---|
| `BRAVE_API_KEY` or `BETTER_WEB_SEARCH_BRAVE_API_KEY` | no | Brave Search API key (primary). [Get one](https://brave.com/search/api/) |
| `TAVILY_API_KEY` or `BETTER_WEB_SEARCH_TAVILY_API_KEY` | no | Tavily key. [tavily.com](https://tavily.com/) |
| `SERPAPI_KEY` / `SERP_API_KEY` | no | Stub for future SERPApi provider |
| `BETTER_WEB_SEARCH_DISABLE_CACHE` | no | `true` → in-memory fallback (no SQLite) |
| `BETTER_WEB_SEARCH_CACHE_PATH` | no | Custom SQLite path (default `data/cache.db`) |
| `BETTER_WEB_SEARCH_DISABLE_BROWSER` | no | `true` → skip Playwright fallback |

The server starts and logs a banner to stderr:

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

Expired cache rows (15 min search, 1 h page) are pruned automatically on startup.

## MCP client configs (copy-paste)

All configs are keyless — add `env` only if you have a key. The same `command` + `args` pattern works for **Claude Desktop, Claude Code, Cursor, VS Code Copilot, Windsurf, OpenCode**, and any MCP stdio client. `mcp.json` and `.vscode/mcp.json` ship in the repo as ready-made examples; `smithery.yaml` covers Smithery deploys.

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

### Local build

```json
{
  "mcpServers": {
    "better-web-search-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/BetterWebSearch-MCP/dist/index.js"]
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

### Smithery

```bash
npx @smithery/cli install better-web-search-mcp  # if published
# or point at this repo's smithery.yaml
```

### OpenCode (`opencode.json`)

```json
{
  "mcp": {
    "better-web-search-mcp": {
      "type": "local",
      "command": ["npx", "-y", "better-web-search-mcp"],
      "enabled": true
    }
  }
}
```

### VS Code Copilot (`.vscode/mcp.json` already included)

VS Code reads `.vscode/mcp.json` → `servers.better-web-search-mcp`. No extra setup.

### Claude Code CLI

```bash
claude mcp add better-web-search-mcp -- npx -y better-web-search-mcp
claude mcp add better-web-search-mcp --env BRAVE_API_KEY=... -- npx -y better-web-search-mcp
```

## CLI

```bash
better-web-search-mcp --help      # prints usage + env + examples
better-web-search-mcp --version   # prints semver
better-web-search-mcp             # start stdio server (banner to stderr)
```

`--help` and `--version` exit before connecting, so they never interfere with MCP handshakes.

## Manual smoke test (no keys)

```bash
npm run build
npx tsx scripts/smoke.mjs              # hits keyless search + extract
BRAVE_API_KEY= npx tsx scripts/smoke.mjs  # proves missing-key warning, not crash
node dist/index.js --help
```

Scripts use deterministic mocks for most CI tests; the live `npx tsx scripts/smoke.mjs` run exercises the real DuckDuckGo path when network is available.

## Scripts

| Script | Description |
|---|---|
| `npm run build` | `tsc` → `dist/` |
| `npm run dev` | `tsx watch src/index.ts` |
| `npm test` | `vitest run` |
| `npm run lint` | `tsc --noEmit` |
| `npm run check:publish` | `npm pack --dry-run` (what will ship to npm) |
| `npm run version:patch` | bump patch + tag (e.g. 0.1.0 → 0.1.1) |
| `npm run release:patch` | version:patch + publish + push --follow-tags |

## Publishing to npm (maintainers)

```bash
# 1. Stay on main, working tree clean
npm run lint && npm test && npm run build

# 2. Bump version (updates package.json + CHANGELOG + git tag)
npm run version:patch   # or version:minor / version:major
# Manually add entry to CHANGELOG.md, then:
git add CHANGELOG.md && git commit --amend --no-edit

# 3. Publish (requires NPM_TOKEN env or `npm login`)
npm publish --access public
# or: npm run release:patch   # does version:patch + publish + git push --follow-tags

# 4. Push + create GitHub Release (auto via .github/workflows/release.yml on tag v*.*.*)
git push --follow-tags
# CI also runs: .github/workflows/ci.yml on every push
```

Or publish via GitHub Actions: push a tag `v0.1.1` — `release.yml` runs `npm publish --provenance`.

Prerequisites: `npm login` or `NPM_TOKEN` secret, repo visibility public for npm (the GitHub repo can stay private, but the npm package is public).

## Architecture (short)

```
QUERY → Search Planner (expandQueries 4–6) → Providers (Brave/Tavily/DuckDuckGo) → allSettled
  → deduplicate(normalizeUrl) → rerank(relevance+domainScore+recency) → top10
  → AccessRouter: HTTP fetch → hydration(JSON-LD/__NEXT_DATA__/self.__next_f) → Playwright(browser+apiIntercept)
  → Content Fusion (api 0.99 > jsonld 0.95 > rendered 0.90 > readability 0.85)
  → domainProfile + apiPatterns cache → structured response
```

See `smithery.yaml`, `mcp.json`, `src/utils/config.ts` (env resolution), and `src/index.ts` (CLI) for the full config story.

## License

MIT
