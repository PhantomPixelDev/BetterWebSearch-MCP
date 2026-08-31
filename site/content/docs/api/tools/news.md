---
title: "API: tools/news"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / tools/news

# tools/news

## Interfaces

### NewsResponse

Defined in: [src/tools/news.ts:27](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/news.ts#L27)

The spec-shaped `web_news` response.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="answer"></a> `answer` | `string` | [src/tools/news.ts:28](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/news.ts#L28) |
| <a id="queries_used"></a> `queries_used` | `string`[] | [src/tools/news.ts:31](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/news.ts#L31) |
| <a id="sources"></a> `sources` | [`SearchSource`](search.html#searchsource)[] | [src/tools/news.ts:29](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/news.ts#L29) |
| <a id="timeline"></a> `timeline` | `Record`\<`string`, [`SearchSource`](search.html#searchsource)[]\> | [src/tools/news.ts:30](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/news.ts#L30) |

## Variables

### newsInputSchema

> `const` **newsInputSchema**: \{ `max_results`: `ZodDefault`\<`ZodNumber`\>; `recency_days`: `ZodDefault`\<`ZodNumber`\>; `topic`: `ZodString`; \}

Defined in: [src/tools/news.ts:20](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/news.ts#L20)

Input schema for `web_news`.

#### Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-max_results"></a> `max_results` | `ZodDefault`\<`ZodNumber`\> | [src/tools/news.ts:23](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/news.ts#L23) |
| <a id="property-recency_days"></a> `recency_days` | `ZodDefault`\<`ZodNumber`\> | [src/tools/news.ts:22](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/news.ts#L22) |
| <a id="property-topic"></a> `topic` | `ZodString` | [src/tools/news.ts:21](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/news.ts#L21) |

## Functions

### registerNews()

> **registerNews**(`server`, `cache?`): `void`

Defined in: [src/tools/news.ts:149](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/news.ts#L149)

Register the `web_news` tool on the given MCP server.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `server` | `McpServer` |
| `cache?` | [`Cache`](../utils/cache.html#cache) |

#### Returns

`void`

***

### runNews()

> **runNews**(`args`): `Promise`\<[`NewsResponse`](#newsresponse)\>

Defined in: [src/tools/news.ts:84](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/news.ts#L84)

Run a recency-filtered news search and return the spec-shaped response.

Exported separately so tests and the smoke harness can call the handler
logic directly.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `cache?`: [`Cache`](../utils/cache.html#cache); `max_results?`: `number`; `recency_days?`: `number`; `topic`: `string`; \} |
| `args.cache?` | [`Cache`](../utils/cache.html#cache) |
| `args.max_results?` | `number` |
| `args.recency_days?` | `number` |
| `args.topic` | `string` |

#### Returns

`Promise`\<[`NewsResponse`](#newsresponse)\>
