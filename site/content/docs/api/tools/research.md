---
title: "API: tools/research"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / tools/research


## Interfaces

### ResearchResponse

Defined in: [src/tools/research.ts:33](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/research.ts#L33)

The spec-shaped `web_research` response.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="answer"></a> `answer` | `string` | [src/tools/research.ts:34](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/research.ts#L34) |
| <a id="extraction_stats"></a> `extraction_stats` | \{ `avgConfidence`: `number`; `method_counts`: `Record`\<`string`, `number`\>; \} | [src/tools/research.ts:37](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/research.ts#L37) |
| `extraction_stats.avgConfidence` | `number` | [src/tools/research.ts:39](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/research.ts#L39) |
| `extraction_stats.method_counts` | `Record`\<`string`, `number`\> | [src/tools/research.ts:38](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/research.ts#L38) |
| <a id="queries_used"></a> `queries_used` | `string`[] | [src/tools/research.ts:36](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/research.ts#L36) |
| <a id="sources"></a> `sources` | [`SearchSource`](search.html#searchsource)[] | [src/tools/research.ts:35](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/research.ts#L35) |

## Variables

### researchInputSchema

> `const` **researchInputSchema**: \{ `count_per_query`: `ZodDefault`\<`ZodNumber`\>; `depth`: `ZodDefault`\<`ZodEnum`\<\[`"quick"`, `"deep"`\]\>\>; `question`: `ZodString`; `recency_days`: `ZodOptional`\<`ZodNumber`\>; \}

Defined in: [src/tools/research.ts:25](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/research.ts#L25)

Input schema for `web_research`.

#### Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-count_per_query"></a> `count_per_query` | `ZodDefault`\<`ZodNumber`\> | [src/tools/research.ts:29](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/research.ts#L29) |
| <a id="property-depth"></a> `depth` | `ZodDefault`\<`ZodEnum`\<\[`"quick"`, `"deep"`\]\>\> | [src/tools/research.ts:27](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/research.ts#L27) |
| <a id="property-question"></a> `question` | `ZodString` | [src/tools/research.ts:26](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/research.ts#L26) |
| <a id="property-recency_days"></a> `recency_days` | `ZodOptional`\<`ZodNumber`\> | [src/tools/research.ts:28](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/research.ts#L28) |

## Functions

### registerResearch()

> **registerResearch**(`server`, `cache?`): `void`

Defined in: [src/tools/research.ts:257](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/research.ts#L257)

Register the `web_research` tool (alias `deep_search`) on the given MCP server.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `server` | `McpServer` |
| `cache?` | [`Cache`](../utils/cache.html#cache) |

#### Returns

`void`

***

### runResearch()

> **runResearch**(`args`): `Promise`\<[`ResearchResponse`](#researchresponse)\>

Defined in: [src/tools/research.ts:188](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/research.ts#L188)

Run a deep research query and return the spec-shaped response.

Exported separately so tests and the smoke harness can call the handler
logic directly.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `cache?`: [`Cache`](../utils/cache.html#cache); `count_per_query?`: `number`; `depth?`: `"deep"` \| `"quick"`; `question`: `string`; `recency_days?`: `number`; \} |
| `args.cache?` | [`Cache`](../utils/cache.html#cache) |
| `args.count_per_query?` | `number` |
| `args.depth?` | `"deep"` \| `"quick"` |
| `args.question` | `string` |
| `args.recency_days?` | `number` |

#### Returns

`Promise`\<[`ResearchResponse`](#researchresponse)\>
