---
title: "API: tools/find"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / tools/find

# tools/find

## Interfaces

### FindResponse

Defined in: [src/tools/find.ts:26](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/find.ts#L26)

The spec-shaped `web_find` response.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="answer"></a> `answer` | `string` | [src/tools/find.ts:27](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/find.ts#L27) |
| <a id="queries_used"></a> `queries_used` | `string`[] | [src/tools/find.ts:29](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/find.ts#L29) |
| <a id="sources"></a> `sources` | [`SearchSource`](search.html#searchsource)[] | [src/tools/find.ts:28](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/find.ts#L28) |

## Variables

### findInputSchema

> `const` **findInputSchema**: \{ `max_results`: `ZodDefault`\<`ZodNumber`\>; `query`: `ZodString`; `site`: `ZodString`; \}

Defined in: [src/tools/find.ts:19](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/find.ts#L19)

Input schema for `web_find`.

#### Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-max_results"></a> `max_results` | `ZodDefault`\<`ZodNumber`\> | [src/tools/find.ts:22](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/find.ts#L22) |
| <a id="property-query"></a> `query` | `ZodString` | [src/tools/find.ts:20](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/find.ts#L20) |
| <a id="property-site"></a> `site` | `ZodString` | [src/tools/find.ts:21](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/find.ts#L21) |

## Functions

### registerFind()

> **registerFind**(`server`, `cache?`): `void`

Defined in: [src/tools/find.ts:87](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/find.ts#L87)

Register the `web_find` tool on the given MCP server.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `server` | `McpServer` |
| `cache?` | [`Cache`](../utils/cache.html#cache) |

#### Returns

`void`

***

### runFind()

> **runFind**(`args`): `Promise`\<[`FindResponse`](#findresponse)\>

Defined in: [src/tools/find.ts:49](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/find.ts#L49)

Run a site-restricted search and return the spec-shaped response.

Exported separately so tests and the smoke harness can call the handler
logic directly.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `cache?`: [`Cache`](../utils/cache.html#cache); `max_results?`: `number`; `query`: `string`; `site`: `string`; \} |
| `args.cache?` | [`Cache`](../utils/cache.html#cache) |
| `args.max_results?` | `number` |
| `args.query` | `string` |
| `args.site` | `string` |

#### Returns

`Promise`\<[`FindResponse`](#findresponse)\>
