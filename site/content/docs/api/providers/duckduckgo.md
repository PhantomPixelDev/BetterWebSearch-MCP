---
title: "API: providers/duckduckgo"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / providers/duckduckgo


## Classes

### DuckDuckGoProvider

Defined in: [src/providers/duckduckgo.ts:16](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/providers/duckduckgo.ts#L16)

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
| <a id="name"></a> `name` | `readonly` | `"duckduckgo"` | `"duckduckgo"` | Stable provider identifier (e.g. "brave", "tavily", "duckduckgo"). | [src/providers/duckduckgo.ts:17](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/providers/duckduckgo.ts#L17) |

#### Methods

##### search()

> **search**(`query`, `opts`): `Promise`\<[`SearchResult`](types.html#searchresult)[]\>

Defined in: [src/providers/duckduckgo.ts:19](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/providers/duckduckgo.ts#L19)

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

### parseHtmlResults()

> **parseHtmlResults**(`html`, `limit`): [`SearchResult`](types.html#searchresult)[]

Defined in: [src/providers/duckduckgo.ts:64](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/providers/duckduckgo.ts#L64)

Parse DuckDuckGo HTML search results into normalized [SearchResult](types.html#searchresult)s.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `html` | `string` |
| `limit` | `number` |

#### Returns

[`SearchResult`](types.html#searchresult)[]
