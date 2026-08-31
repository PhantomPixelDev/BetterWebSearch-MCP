---
title: "API: tools/extract"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / tools/extract

# tools/extract

## Interfaces

### ExtractResponse

Defined in: [src/tools/extract.ts:28](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/extract.ts#L28)

The spec-shaped per-URL extraction response.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="api_endpoints"></a> `api_endpoints` | `unknown` | [src/tools/extract.ts:38](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/extract.ts#L38) |
| <a id="content"></a> `content` | `string` | [src/tools/extract.ts:31](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/extract.ts#L31) |
| <a id="extraction"></a> `extraction` | \{ `confidence`: `number`; `method`: `string`; `rendered`: `boolean`; \} | [src/tools/extract.ts:32](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/extract.ts#L32) |
| `extraction.confidence` | `number` | [src/tools/extract.ts:34](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/extract.ts#L34) |
| `extraction.method` | `string` | [src/tools/extract.ts:33](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/extract.ts#L33) |
| `extraction.rendered` | `boolean` | [src/tools/extract.ts:35](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/extract.ts#L35) |
| <a id="metadata"></a> `metadata` | [`PageMetadata`](../extraction/metadata.html#pagemetadata) | [src/tools/extract.ts:39](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/extract.ts#L39) |
| <a id="structured_data"></a> `structured_data` | `unknown` | [src/tools/extract.ts:37](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/extract.ts#L37) |
| <a id="title"></a> `title` | `string` | [src/tools/extract.ts:30](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/extract.ts#L30) |
| <a id="url"></a> `url` | `string` | [src/tools/extract.ts:29](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/extract.ts#L29) |

## Variables

### extractInputSchema

> `const` **extractInputSchema**: \{ `browser_fallback`: `ZodDefault`\<`ZodBoolean`\>; `include_api_data`: `ZodDefault`\<`ZodBoolean`\>; `include_structured_data`: `ZodDefault`\<`ZodBoolean`\>; `mode`: `ZodDefault`\<`ZodEnum`\<\[`"auto"`, `"fast"`, `"browser"`\]\>\>; `urls`: `ZodArray`\<`ZodString`, `"many"`\>; \}

Defined in: [src/tools/extract.ts:19](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/extract.ts#L19)

Input schema for `web_extract`.

#### Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-browser_fallback"></a> `browser_fallback` | `ZodDefault`\<`ZodBoolean`\> | [src/tools/extract.ts:24](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/extract.ts#L24) |
| <a id="property-include_api_data"></a> `include_api_data` | `ZodDefault`\<`ZodBoolean`\> | [src/tools/extract.ts:22](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/extract.ts#L22) |
| <a id="property-include_structured_data"></a> `include_structured_data` | `ZodDefault`\<`ZodBoolean`\> | [src/tools/extract.ts:23](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/extract.ts#L23) |
| <a id="property-mode"></a> `mode` | `ZodDefault`\<`ZodEnum`\<\[`"auto"`, `"fast"`, `"browser"`\]\>\> | [src/tools/extract.ts:21](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/extract.ts#L21) |
| <a id="property-urls"></a> `urls` | `ZodArray`\<`ZodString`, `"many"`\> | [src/tools/extract.ts:20](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/extract.ts#L20) |

## Functions

### registerExtract()

> **registerExtract**(`server`, `cache?`): `void`

Defined in: [src/tools/extract.ts:173](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/extract.ts#L173)

Register the `web_extract` tool on the given MCP server.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `server` | `McpServer` |
| `cache?` | [`Cache`](../utils/cache.html#cache) |

#### Returns

`void`

***

### runExtract()

> **runExtract**(`args`): `Promise`\<[`ExtractResponse`](#extractresponse)[]\>

Defined in: [src/tools/extract.ts:134](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/extract.ts#L134)

Run a bounded-concurrency extraction over the given URLs.

Exported separately so tests and the smoke harness can call the handler
logic directly.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `browser_fallback?`: `boolean`; `cache?`: [`Cache`](../utils/cache.html#cache); `include_api_data?`: `boolean`; `include_structured_data?`: `boolean`; `mode?`: `"auto"` \| `"browser"` \| `"fast"`; `urls`: `string`[]; \} |
| `args.browser_fallback?` | `boolean` |
| `args.cache?` | [`Cache`](../utils/cache.html#cache) |
| `args.include_api_data?` | `boolean` |
| `args.include_structured_data?` | `boolean` |
| `args.mode?` | `"auto"` \| `"browser"` \| `"fast"` |
| `args.urls` | `string`[] |

#### Returns

`Promise`\<[`ExtractResponse`](#extractresponse)[]\>
