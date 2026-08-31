---
title: "Providers"
description: "How search providers work — DuckDuckGo keyless fallback, Brave, Tavily, and SerpApi, aggregated via Promise.allSettled."
weight: 30
---

BetterWebSearch MCP uses a provider abstraction layer. Each provider implements the same `SearchProvider` interface, so the aggregation layer treats them uniformly. Providers are enabled or disabled based on environment keys.

## Provider overview

| Provider | Key needed? | Env var | Status |
|---|---|---|---|
| **DuckDuckGo** | No | — | Always on (keyless fallback) |
| **Brave** | Yes | `BRAVE_API_KEY` | Primary — better ranking & recency |
| **Tavily** | Yes | `TAVILY_API_KEY` | Optional — when present |
| **SerpApi** | Yes | `SERPAPI_KEY` | Stub — not yet implemented |

## Keyless-first design

DuckDuckGo is **always enabled** and requires no API key. This means:

1. `npx -y better-web-search-mcp` works immediately — no configuration needed
2. The test suite (189+ tests) runs fully keyless
3. Other providers are opt-in — add `BRAVE_API_KEY` for richer results

## SearchProvider interface

Every provider implements this interface:

```typescript
interface SearchProvider {
  /** Stable provider identifier (e.g. "brave", "tavily", "duckduckgo"). */
  name: string;

  /**
   * Run a search and return normalized results.
   * Implementations MUST NOT throw on provider errors (missing key, HTTP
   * 401/429, timeout). They return an empty array and log a warning instead,
   * so one failing provider never breaks the aggregate search.
   */
  search(query: string, opts: SearchOptions): Promise<SearchResult[]>;
}
```

Each provider normalizes its native API response into a common `SearchResult` shape:

```typescript
interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  published?: string;   // ISO date string
  score?: number;        // 0-1 relevance score
  source: string;        // provider name
}
```

## Aggregation

Providers are aggregated via `Promise.allSettled` — one failing provider never aborts the others. Rejected providers are logged as warnings and skipped; fulfilled results are flattened into a single array.

```typescript
async function aggregateSearch(query: string, opts: SearchOptions): Promise<SearchResult[]> {
  const providers = enabledProviders();
  const settled = await Promise.allSettled(
    providers.map((provider) => provider.search(query, opts)),
  );
  // ... flatten fulfilled results
}
```

## Ranking pipeline

After aggregation, results go through:

1. **Deduplication** — `normalizeUrl` strips tracking params (utm, gclid, fbclid), trailing slashes, and hashes
2. **Domain scoring** — curated tiers assign authority scores
3. **Re-ranking** — `0.5 × text_overlap + 0.2 × domain_score + 0.2 × recency + 0.1 × provider_score`

## Query expansion

`web_research` / `deep_search` expands the input question into 4–6 parallel search variants before querying providers. For example:

- Input: `unlimited mobile internet Germany`
- Variants include: `unbegrenztes Datenvolumen Deutschland`, `unlimited data plan Germany 2026`, `best unlimited mobile Germany`, etc.

All variants are searched in parallel across all enabled providers.

## Provider-specific notes

### Brave

- Provides freshness filtering (`pd`/`pw`/`pm`/`py` time ranges)
- Supports extra snippets for deeper content
- Best ranking and recency when `BRAVE_API_KEY` is set

### Tavily

- Optional secondary provider
- Enabled when `TAVILY_API_KEY` (or `BETTER_WEB_SEARCH_TAVILY_API_KEY`) is set

### DuckDuckGo

- Always on, zero configuration
- Provides the baseline search capability
- Falls back gracefully when other providers are unavailable

### SerpApi

- Stub implementation — included in the provider list but returns no results
- Reserved for future development
