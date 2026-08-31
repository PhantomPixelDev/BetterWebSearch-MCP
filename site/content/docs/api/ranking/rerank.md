---
title: "API: ranking/rerank"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / ranking/rerank


## Interfaces

### RankedResult

Defined in: [src/ranking/rerank.ts:10](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/ranking/rerank.ts#L10)

A ranked result: the original result plus its computed relevance score.

#### Extends

- [`SearchResult`](../providers/types.html#searchresult)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="published"></a> `published?` | `string` | ISO date string of publication, when the provider exposes it. | [`SearchResult`](../providers/types.html#searchresult).[`published`](../providers/types.html#published) | [src/providers/types.ts:19](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/providers/types.ts#L19) |
| <a id="relevance"></a> `relevance` | `number` | Combined relevance score in [0, 1]. | - | [src/ranking/rerank.ts:12](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/ranking/rerank.ts#L12) |
| <a id="score"></a> `score?` | `number` | A 0-1 relevance/quality score assigned by the provider, when available. | [`SearchResult`](../providers/types.html#searchresult).[`score`](../providers/types.html#score) | [src/providers/types.ts:21](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/providers/types.ts#L21) |
| <a id="snippet"></a> `snippet` | `string` | A short text snippet / description of the result. | [`SearchResult`](../providers/types.html#searchresult).[`snippet`](../providers/types.html#snippet) | [src/providers/types.ts:17](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/providers/types.ts#L17) |
| <a id="source"></a> `source` | `string` | The name of the provider that produced this result. | [`SearchResult`](../providers/types.html#searchresult).[`source`](../providers/types.html#source) | [src/providers/types.ts:23](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/providers/types.ts#L23) |
| <a id="title"></a> `title` | `string` | The result title. | [`SearchResult`](../providers/types.html#searchresult).[`title`](../providers/types.html#title) | [src/providers/types.ts:13](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/providers/types.ts#L13) |
| <a id="url"></a> `url` | `string` | The canonical URL of the result. | [`SearchResult`](../providers/types.html#searchresult).[`url`](../providers/types.html#url) | [src/providers/types.ts:15](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/providers/types.ts#L15) |

## Functions

### rerank()

> **rerank**(`results`, `query`, `recencyDays?`): [`RankedResult`](#rankedresult)[]

Defined in: [src/ranking/rerank.ts:24](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/ranking/rerank.ts#L24)

Re-rank search results against a query.

Score = 0.5 * termOverlap + 0.2 * domainScore + 0.2 * recencyBoost
        + 0.1 * normalizedOriginalScore

Pure function: does not mutate the input array. Results are returned
sorted by relevance descending.

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `results` | readonly [`SearchResult`](../providers/types.html#searchresult)[] | `undefined` |
| `query` | `string` | `undefined` |
| `recencyDays` | `number` | `DEFAULT_RECENCY_DAYS` |

#### Returns

[`RankedResult`](#rankedresult)[]
