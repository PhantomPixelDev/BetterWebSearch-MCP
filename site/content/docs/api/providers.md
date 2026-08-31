---
title: "API: providers"
weight: 80
draft: false
---

[**better-web-search-mcp**](index.html)

***

[better-web-search-mcp](index.html) / providers

# providers

## Functions

### aggregateSearch()

> **aggregateSearch**(`query`, `opts?`): `Promise`\<[`SearchResult`](providers/types.html#searchresult)[]\>

Defined in: [src/providers/index.ts:39](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/providers/index.ts#L39)

Aggregate search across all enabled providers.

Uses `Promise.allSettled` so one failing provider never aborts the others.
Rejected providers are logged as warnings and skipped; fulfilled results
are flattened into a single array.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |
| `opts` | [`SearchOptions`](providers/types.html#searchoptions) |

#### Returns

`Promise`\<[`SearchResult`](providers/types.html#searchresult)[]\>

***

### enabledProviders()

> **enabledProviders**(): [`SearchProvider`](providers/types.html#searchprovider)[]

Defined in: [src/providers/index.ts:16](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/providers/index.ts#L16)

Build the list of enabled providers based on environment keys.

- Brave: enabled when `BRAVE_API_KEY` (or BETTER_WEB_SEARCH_BRAVE_API_KEY) is set.
- Tavily: enabled when `TAVILY_API_KEY` (or BETTER_WEB_SEARCH_TAVILY_API_KEY) is set.
- DuckDuckGo: always enabled (keyless free fallback) — zero-config.
- SerpApi: stub, always included (returns no results until implemented).

#### Returns

[`SearchProvider`](providers/types.html#searchprovider)[]
