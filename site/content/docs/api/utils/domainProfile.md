---
title: "API: utils/domainProfile"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / utils/domainProfile


## Interfaces

### DomainProfile

Defined in: [src/utils/domainProfile.ts:20](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/domainProfile.ts#L20)

A per-domain capability profile.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="api_patterns"></a> `api_patterns` | `string`[] | API endpoint patterns discovered for this domain. | [src/utils/domainProfile.ts:28](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/domainProfile.ts#L28) |
| <a id="best_method"></a> `best_method` | [`BestMethod`](#bestmethod-1) | The extraction method that worked best on the last visit. | [src/utils/domainProfile.ts:30](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/domainProfile.ts#L30) |
| <a id="framework"></a> `framework` | [`Framework`](#framework-1) | The framework detected from HTML markers. | [src/utils/domainProfile.ts:24](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/domainProfile.ts#L24) |
| <a id="has_json_ld"></a> `has_json_ld` | `boolean` | Whether the page embeds JSON-LD structured data. | [src/utils/domainProfile.ts:26](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/domainProfile.ts#L26) |
| <a id="requires_js"></a> `requires_js` | `boolean` | Whether the page needs JavaScript to produce content. | [src/utils/domainProfile.ts:22](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/domainProfile.ts#L22) |

***

### ExtractionResult

Defined in: [src/utils/domainProfile.ts:34](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/domainProfile.ts#L34)

The outcome of an extraction, used to build the profile.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="apipatterns"></a> `apiPatterns` | `string`[] | API endpoint patterns discovered for this domain. | [src/utils/domainProfile.ts:38](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/domainProfile.ts#L38) |
| <a id="bestmethod"></a> `bestMethod` | [`BestMethod`](#bestmethod-1) | The extraction method that worked best on this visit. | [src/utils/domainProfile.ts:40](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/domainProfile.ts#L40) |
| <a id="hasjsonld"></a> `hasJsonLd` | `boolean` | Whether the page embeds JSON-LD structured data. | [src/utils/domainProfile.ts:36](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/domainProfile.ts#L36) |

## Type Aliases

### BestMethod

> **BestMethod** = `"hydration_data"` \| `"readability"` \| `"browser_api_intercept"`

Defined in: [src/utils/domainProfile.ts:14](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/domainProfile.ts#L14)

The extraction method that worked best for a domain.

***

### Framework

> **Framework** = `"Next.js:Pages"` \| `"Next.js:App"` \| `"Nuxt"` \| `"unknown"`

Defined in: [src/utils/domainProfile.ts:11](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/domainProfile.ts#L11)

Frameworks the profiler can recognize from HTML markers.

## Functions

### detectFramework()

> **detectFramework**(`html`): [`Framework`](#framework-1)

Defined in: [src/utils/domainProfile.ts:61](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/domainProfile.ts#L61)

Detect the framework a page runs on from HTML markers.

- `__NEXT_DATA__` → Next.js (Pages Router)
- `self.__next_f` → Next.js (App Router)
- `__NUXT__` → Nuxt
- otherwise → unknown

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `html` | `string` |

#### Returns

[`Framework`](#framework-1)

***

### profileFor()

> **profileFor**(`domain`, `html`, `extractionResult`): [`DomainProfile`](#domainprofile)

Defined in: [src/utils/domainProfile.ts:85](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/domainProfile.ts#L85)

Build a domain profile from the raw HTML and the outcome of an extraction.

`requires_js` is true when the page's visible text (after stripping tags,
scripts, and styles) is shorter than 500 characters — a strong signal the
content is rendered client-side. `framework` comes from the HTML markers,
`has_json_ld` and `api_patterns` from the extraction result, and
`best_method` records which extraction strategy worked best. The `domain`
argument is kept in the signature for call-site stability and future
per-domain merging.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `domain` | `string` |
| `html` | `string` |
| `extractionResult` | [`ExtractionResult`](#extractionresult) |

#### Returns

[`DomainProfile`](#domainprofile)
