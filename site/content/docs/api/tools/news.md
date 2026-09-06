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

Defined in: [src/tools/news.ts:33](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/news.ts#L33)

The spec-shaped `web_news` response.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="answer"></a> `answer` | `string` | - | [src/tools/news.ts:34](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/news.ts#L34) |
| <a id="queries_used"></a> `queries_used` | `string`[] | - | [src/tools/news.ts:37](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/news.ts#L37) |
| <a id="recency_verified"></a> `recency_verified` | `boolean` | Whether every returned source carried a publication date inside the requested window. False means the results are topical but their age is unknown, which happens on the keyless path: DuckDuckGo's HTML endpoint does not supply dates. An agent should not describe those as "from the last N days". | [src/tools/news.ts:48](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/news.ts#L48) |
| <a id="sources"></a> `sources` | [`SearchSource`](search.html#searchsource)[] | - | [src/tools/news.ts:35](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/news.ts#L35) |
| <a id="timeline"></a> `timeline` | `Record`\<`string`, [`SearchSource`](search.html#searchsource)[]\> | - | [src/tools/news.ts:36](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/news.ts#L36) |
| <a id="warnings"></a> `warnings?` | `string`[] | Providers that refused or failed, so an empty result reads correctly. | [src/tools/news.ts:39](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/news.ts#L39) |

## Variables

### newsInputSchema

> `const` **newsInputSchema**: \{ `max_results`: `ZodDefault`\<`ZodNumber`\>; `recency_days`: `ZodDefault`\<`ZodNumber`\>; `topic`: `ZodString`; \}

Defined in: [src/tools/news.ts:26](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/news.ts#L26)

Input schema for `web_news`.

#### Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-max_results"></a> `max_results` | `ZodDefault`\<`ZodNumber`\> | [src/tools/news.ts:29](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/news.ts#L29) |
| <a id="property-recency_days"></a> `recency_days` | `ZodDefault`\<`ZodNumber`\> | [src/tools/news.ts:28](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/news.ts#L28) |
| <a id="property-topic"></a> `topic` | `ZodString` | [src/tools/news.ts:27](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/news.ts#L27) |

## Functions

### registerNews()

> **registerNews**(`server`, `cache?`): `void`

Defined in: [src/tools/news.ts:191](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/news.ts#L191)

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

Defined in: [src/tools/news.ts:101](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/news.ts#L101)

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
