---
title: "API: tools/search"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / tools/search


## Interfaces

### SearchResponse

Defined in: [src/tools/search.ts:35](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/search.ts#L35)

The spec-shaped `web_search` response.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="answer"></a> `answer` | `string` | [src/tools/search.ts:36](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/search.ts#L36) |
| <a id="queries_used"></a> `queries_used` | `string`[] | [src/tools/search.ts:38](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/search.ts#L38) |
| <a id="sources"></a> `sources` | [`SearchSource`](#searchsource)[] | [src/tools/search.ts:37](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/search.ts#L37) |

***

### SearchSource

Defined in: [src/tools/search.ts:26](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/search.ts#L26)

The spec-shaped source entry returned for each result.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="published"></a> `published?` | `string` | [src/tools/search.ts:30](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/search.ts#L30) |
| <a id="relevance"></a> `relevance` | `number` | [src/tools/search.ts:31](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/search.ts#L31) |
| <a id="snippet"></a> `snippet` | `string` | [src/tools/search.ts:29](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/search.ts#L29) |
| <a id="title"></a> `title` | `string` | [src/tools/search.ts:27](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/search.ts#L27) |
| <a id="url"></a> `url` | `string` | [src/tools/search.ts:28](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/search.ts#L28) |

## Variables

### searchInputSchema

> `const` **searchInputSchema**: \{ `max_results`: `ZodDefault`\<`ZodNumber`\>; `query`: `ZodString`; `recency_days`: `ZodOptional`\<`ZodNumber`\>; \}

Defined in: [src/tools/search.ts:19](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/search.ts#L19)

Input schema for `web_search`.

#### Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-max_results"></a> `max_results` | `ZodDefault`\<`ZodNumber`\> | [src/tools/search.ts:21](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/search.ts#L21) |
| <a id="property-query"></a> `query` | `ZodString` | [src/tools/search.ts:20](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/search.ts#L20) |
| <a id="property-recency_days"></a> `recency_days` | `ZodOptional`\<`ZodNumber`\> | [src/tools/search.ts:22](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/search.ts#L22) |

## Functions

### registerSearch()

> **registerSearch**(`server`, `cache?`): `void`

Defined in: [src/tools/search.ts:101](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/search.ts#L101)

Register the `web_search` tool on the given MCP server.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `server` | `McpServer` |
| `cache?` | [`Cache`](../utils/cache.html#cache) |

#### Returns

`void`

***

### runSearch()

> **runSearch**(`args`): `Promise`\<[`SearchResponse`](#searchresponse)\>

Defined in: [src/tools/search.ts:58](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/search.ts#L58)

Run a `web_search` and return the spec-shaped response.

Exported separately from the registration so tests and the smoke harness
can call the handler logic directly.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `cache?`: [`Cache`](../utils/cache.html#cache); `max_results?`: `number`; `query`: `string`; `recency_days?`: `number`; \} |
| `args.cache?` | [`Cache`](../utils/cache.html#cache) |
| `args.max_results?` | `number` |
| `args.query` | `string` |
| `args.recency_days?` | `number` |

#### Returns

`Promise`\<[`SearchResponse`](#searchresponse)\>
