---
title: "API: extraction/structured"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / extraction/structured


## Interfaces

### StructuredData

Defined in: [src/extraction/structured.ts:13](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/structured.ts#L13)

The result of a structured-data extraction.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="apollo"></a> `apollo` | `unknown` | Parsed `window.__APOLLO_STATE__` payload, when present. | [src/extraction/structured.ts:23](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/structured.ts#L23) |
| <a id="initialstate"></a> `initialState` | `unknown` | Parsed `window.__INITIAL_STATE__` payload, when present. | [src/extraction/structured.ts:25](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/structured.ts#L25) |
| <a id="jsonld"></a> `jsonLd` | `unknown`[] | Parsed JSON-LD objects (with `@graph` unwrapped into its members). | [src/extraction/structured.ts:15](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/structured.ts#L15) |
| <a id="nextdata"></a> `nextData` | `unknown` | Parsed `#__NEXT_DATA__` payload, when present. | [src/extraction/structured.ts:17](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/structured.ts#L17) |
| <a id="nextflight"></a> `nextFlight` | `string` | Concatenated `self.__next_f.push` flight chunks, when present. | [src/extraction/structured.ts:19](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/structured.ts#L19) |
| <a id="nuxt"></a> `nuxt` | `unknown` | Parsed `window.__NUXT__` payload, when present. | [src/extraction/structured.ts:21](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/structured.ts#L21) |

## Variables

### EMPTY\_STRUCTURED

> `const` **EMPTY\_STRUCTURED**: [`StructuredData`](#structureddata)

Defined in: [src/extraction/structured.ts:29](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/structured.ts#L29)

An empty structured-data result, used when nothing is found.

## Functions

### extractStructuredData()

> **extractStructuredData**(`html`): [`StructuredData`](#structureddata)

Defined in: [src/extraction/structured.ts:185](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/structured.ts#L185)

Extract all structured / hydration data from an HTML page.

Every extractor is defensive: malformed JSON-LD, broken `__NEXT_DATA__`,
or truncated window globals are skipped silently rather than thrown.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `html` | `string` |

#### Returns

[`StructuredData`](#structureddata)
