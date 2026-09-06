---
title: "API: providers"
weight: 80
draft: false
---

[**better-web-search-mcp**](index.html)

***

[better-web-search-mcp](index.html) / providers

# providers

## Interfaces

### AggregateOutcome

Defined in: [src/providers/index.ts:71](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/providers/index.ts#L71)

What aggregation produced, including why any provider contributed nothing.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="results"></a> `results` | [`SearchResult`](providers/types.html#searchresult)[] | Results flattened across every provider that answered. | [src/providers/index.ts:73](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/providers/index.ts#L73) |
| <a id="warnings"></a> `warnings` | `string`[] | Human-readable notes about providers that refused or failed. Surfaced so a caller can tell "the search was throttled" from "nothing matched". Those were previously indistinguishable, which made a working site-restricted query look broken. | [src/providers/index.ts:81](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/providers/index.ts#L81) |

## Variables

### PROVIDER\_TIMEOUT\_MS

> `const` **PROVIDER\_TIMEOUT\_MS**: `10000` = `10_000`

Defined in: [src/providers/index.ts:34](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/providers/index.ts#L34)

Wall-clock budget for a single provider, in milliseconds.

## Functions

### aggregateSearch()

> **aggregateSearch**(`query`, `opts?`): `Promise`\<[`SearchResult`](providers/types.html#searchresult)[]\>

Defined in: [src/providers/index.ts:130](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/providers/index.ts#L130)

Aggregate search across providers, discarding failure detail.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |
| `opts` | [`SearchOptions`](providers/types.html#searchoptions) |

#### Returns

`Promise`\<[`SearchResult`](providers/types.html#searchresult)[]\>

***

### aggregateSearchDetailed()

> **aggregateSearchDetailed**(`query`, `opts?`): `Promise`\<[`AggregateOutcome`](#aggregateoutcome)\>

Defined in: [src/providers/index.ts:90](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/providers/index.ts#L90)

Aggregate search and report which providers failed.

[aggregateSearch](#aggregatesearch) keeps the older results-only shape for callers that
do not care why a provider was quiet.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |
| `opts` | [`SearchOptions`](providers/types.html#searchoptions) |

#### Returns

`Promise`\<[`AggregateOutcome`](#aggregateoutcome)\>

***

### enabledProviders()

> **enabledProviders**(): [`SearchProvider`](providers/types.html#searchprovider)[]

Defined in: [src/providers/index.ts:18](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/providers/index.ts#L18)

Build the list of enabled providers based on environment keys.

- Brave: enabled when `BRAVE_API_KEY` (or BETTER_WEB_SEARCH_BRAVE_API_KEY) is set.
- Tavily: enabled when `TAVILY_API_KEY` (or BETTER_WEB_SEARCH_TAVILY_API_KEY) is set.
- DuckDuckGo: always enabled (keyless free fallback) — zero-config.

SerpApi is deliberately absent: `SerpApiProvider` is still a stub, so
including it only added a no-op call to every aggregation.

#### Returns

[`SearchProvider`](providers/types.html#searchprovider)[]
