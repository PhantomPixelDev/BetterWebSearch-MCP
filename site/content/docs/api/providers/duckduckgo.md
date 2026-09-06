---
title: "API: providers/duckduckgo"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / providers/duckduckgo

# providers/duckduckgo

## Classes

### DuckDuckGoProvider

Defined in: [src/providers/duckduckgo.ts:18](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/providers/duckduckgo.ts#L18)

DuckDuckGo provider (free, keyless fallback).

Scrapes the public HTML search endpoint and parses results with cheerio.
Always enabled — no API key required. On any failure (network, timeout,
parse) it returns an empty array and logs a warning rather than throwing.

#### Implements

- [`SearchProvider`](types.html#searchprovider)

#### Constructors

##### Constructor

> **new DuckDuckGoProvider**(): [`DuckDuckGoProvider`](#duckduckgoprovider)

###### Returns

[`DuckDuckGoProvider`](#duckduckgoprovider)

#### Properties

| Property | Modifier | Type | Default value | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="name"></a> `name` | `readonly` | `"duckduckgo"` | `"duckduckgo"` | Stable provider identifier (e.g. "brave", "tavily", "duckduckgo"). | [src/providers/duckduckgo.ts:19](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/providers/duckduckgo.ts#L19) |

#### Methods

##### search()

> **search**(`query`, `opts`): `Promise`\<[`SearchResult`](types.html#searchresult)[]\>

Defined in: [src/providers/duckduckgo.ts:21](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/providers/duckduckgo.ts#L21)

Run a search and return normalized results.

Implementations MUST NOT throw on provider errors (missing key, HTTP
401/429, timeout). They return an empty array and log a warning instead,
so one failing provider never breaks the aggregate search.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |
| `opts` | [`SearchOptions`](types.html#searchoptions) |

###### Returns

`Promise`\<[`SearchResult`](types.html#searchresult)[]\>

###### Implementation of

[`SearchProvider`](types.html#searchprovider).[`search`](types.html#search)

## Functions

### isChallengePage()

> **isChallengePage**(`html`): `boolean`

Defined in: [src/providers/duckduckgo.ts:105](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/providers/duckduckgo.ts#L105)

Whether the HTML is a bot-detection challenge rather than a result page.

The endpoint answers a throttled request with a 2xx status and an anomaly
page, so status alone cannot tell the two apart. Requiring both the absence
of result markup and a challenge marker avoids calling a genuinely empty
search a block.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `html` | `string` |

#### Returns

`boolean`

***

### parseHtmlResults()

> **parseHtmlResults**(`html`, `limit`): [`SearchResult`](types.html#searchresult)[]

Defined in: [src/providers/duckduckgo.ts:113](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/providers/duckduckgo.ts#L113)

Parse DuckDuckGo HTML search results into normalized [SearchResult](types.html#searchresult)s.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `html` | `string` |
| `limit` | `number` |

#### Returns

[`SearchResult`](types.html#searchresult)[]
