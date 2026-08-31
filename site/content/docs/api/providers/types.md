---
title: "API: providers/types"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / providers/types

# providers/types

## Interfaces

### SearchOptions

Defined in: [src/providers/types.ts:27](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/providers/types.ts#L27)

Options controlling a single provider search.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="count"></a> `count?` | `number` | Maximum number of results to request. | [src/providers/types.ts:29](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/providers/types.ts#L29) |
| <a id="extrasnippets"></a> `extraSnippets?` | `boolean` | Request extra snippets from providers that support it (Brave). | [src/providers/types.ts:35](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/providers/types.ts#L35) |
| <a id="freshness"></a> `freshness?` | `string` | Provider-specific freshness filter (e.g. Brave "pd"/"pw"/"pm"/"py"). | [src/providers/types.ts:31](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/providers/types.ts#L31) |
| <a id="recency_days"></a> `recency_days?` | `number` | Number of days back to restrict results to. | [src/providers/types.ts:33](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/providers/types.ts#L33) |

***

### SearchProvider

Defined in: [src/providers/types.ts:39](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/providers/types.ts#L39)

A search provider that can be queried and returns normalized results.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="name"></a> `name` | `string` | Stable provider identifier (e.g. "brave", "tavily", "duckduckgo"). | [src/providers/types.ts:41](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/providers/types.ts#L41) |

#### Methods

##### search()

> **search**(`query`, `opts`): `Promise`\<[`SearchResult`](#searchresult)[]\>

Defined in: [src/providers/types.ts:49](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/providers/types.ts#L49)

Run a search and return normalized results.

Implementations MUST NOT throw on provider errors (missing key, HTTP
401/429, timeout). They return an empty array and log a warning instead,
so one failing provider never breaks the aggregate search.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |
| `opts` | [`SearchOptions`](#searchoptions) |

###### Returns

`Promise`\<[`SearchResult`](#searchresult)[]\>

***

### SearchResult

Defined in: [src/providers/types.ts:11](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/providers/types.ts#L11)

A single normalized search result returned by any provider.

#### Extended by

- [`RankedResult`](../ranking/rerank.html#rankedresult)

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="published"></a> `published?` | `string` | ISO date string of publication, when the provider exposes it. | [src/providers/types.ts:19](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/providers/types.ts#L19) |
| <a id="score"></a> `score?` | `number` | A 0-1 relevance/quality score assigned by the provider, when available. | [src/providers/types.ts:21](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/providers/types.ts#L21) |
| <a id="snippet"></a> `snippet` | `string` | A short text snippet / description of the result. | [src/providers/types.ts:17](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/providers/types.ts#L17) |
| <a id="source"></a> `source` | `string` | The name of the provider that produced this result. | [src/providers/types.ts:23](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/providers/types.ts#L23) |
| <a id="title"></a> `title` | `string` | The result title. | [src/providers/types.ts:13](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/providers/types.ts#L13) |
| <a id="url"></a> `url` | `string` | The canonical URL of the result. | [src/providers/types.ts:15](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/providers/types.ts#L15) |
