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

Defined in: [src/tools/extract.ts:39](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/extract.ts#L39)

The spec-shaped per-URL extraction response.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="api_endpoints"></a> `api_endpoints` | `unknown` | - | [src/tools/extract.ts:49](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/extract.ts#L49) |
| <a id="content"></a> `content` | `string` | - | [src/tools/extract.ts:42](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/extract.ts#L42) |
| <a id="extraction"></a> `extraction` | \{ `confidence`: `number`; `method`: `string`; `rendered`: `boolean`; \} | - | [src/tools/extract.ts:43](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/extract.ts#L43) |
| `extraction.confidence` | `number` | - | [src/tools/extract.ts:45](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/extract.ts#L45) |
| `extraction.method` | `string` | - | [src/tools/extract.ts:44](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/extract.ts#L44) |
| `extraction.rendered` | `boolean` | - | [src/tools/extract.ts:46](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/extract.ts#L46) |
| <a id="metadata"></a> `metadata` | [`PageMetadata`](../extraction/metadata.html#pagemetadata) | - | [src/tools/extract.ts:50](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/extract.ts#L50) |
| <a id="security"></a> `security` | [`SecurityReport`](../extraction/untrusted.html#securityreport) | Provenance for the content above. Page text is attacker-controlled, so it is always marked untrusted and screened for text addressing the agent. | [src/tools/extract.ts:55](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/extract.ts#L55) |
| <a id="structured_data"></a> `structured_data` | `unknown` | - | [src/tools/extract.ts:48](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/extract.ts#L48) |
| <a id="title"></a> `title` | `string` | - | [src/tools/extract.ts:41](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/extract.ts#L41) |
| <a id="url"></a> `url` | `string` | - | [src/tools/extract.ts:40](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/extract.ts#L40) |

## Variables

### BROWSER\_URL\_TIMEOUT\_MS

> `const` **BROWSER\_URL\_TIMEOUT\_MS**: `35000` = `35_000`

Defined in: [src/tools/extract.ts:62](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/extract.ts#L62)

Per-URL timeout when a browser render may run, in milliseconds.

***

### extractInputSchema

> `const` **extractInputSchema**: \{ `browser_fallback`: `ZodDefault`\<`ZodBoolean`\>; `include_api_data`: `ZodDefault`\<`ZodBoolean`\>; `include_structured_data`: `ZodDefault`\<`ZodBoolean`\>; `mode`: `ZodDefault`\<`ZodEnum`\<\[`"auto"`, `"fast"`, `"browser"`\]\>\>; `urls`: `ZodArray`\<`ZodString`, `"many"`\>; \}

Defined in: [src/tools/extract.ts:30](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/extract.ts#L30)

Input schema for `web_extract`.

#### Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-browser_fallback"></a> `browser_fallback` | `ZodDefault`\<`ZodBoolean`\> | [src/tools/extract.ts:35](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/extract.ts#L35) |
| <a id="property-include_api_data"></a> `include_api_data` | `ZodDefault`\<`ZodBoolean`\> | [src/tools/extract.ts:33](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/extract.ts#L33) |
| <a id="property-include_structured_data"></a> `include_structured_data` | `ZodDefault`\<`ZodBoolean`\> | [src/tools/extract.ts:34](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/extract.ts#L34) |
| <a id="property-mode"></a> `mode` | `ZodDefault`\<`ZodEnum`\<\[`"auto"`, `"fast"`, `"browser"`\]\>\> | [src/tools/extract.ts:32](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/extract.ts#L32) |
| <a id="property-urls"></a> `urls` | `ZodArray`\<`ZodString`, `"many"`\> | [src/tools/extract.ts:31](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/extract.ts#L31) |

***

### URL\_TIMEOUT\_MS

> `const` **URL\_TIMEOUT\_MS**: `8000` = `8_000`

Defined in: [src/tools/extract.ts:59](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/extract.ts#L59)

Per-URL timeout when the browser tier cannot run, in milliseconds.

## Functions

### registerExtract()

> **registerExtract**(`server`, `cache?`): `void`

Defined in: [src/tools/extract.ts:206](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/extract.ts#L206)

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

Defined in: [src/tools/extract.ts:167](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/extract.ts#L167)

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

***

### timeoutForMode()

> **timeoutForMode**(`mode`, `browserFallback`): `number`

Defined in: [src/tools/extract.ts:65](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/extract.ts#L65)

The per-URL budget for a given mode / fallback combination.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `mode` | `"auto"` \| `"browser"` \| `"fast"` |
| `browserFallback` | `boolean` |

#### Returns

`number`
