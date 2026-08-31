---
title: "API: extraction/evidence"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / extraction/evidence

# extraction/evidence

## Interfaces

### Evidence

Defined in: [src/extraction/evidence.ts:18](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/evidence.ts#L18)

A single piece of extracted content with provenance and confidence.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="confidence"></a> `confidence` | `number` | Confidence in this evidence, 0..1. | [src/extraction/evidence.ts:24](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/evidence.ts#L24) |
| <a id="snippet"></a> `snippet?` | `string` | A short snippet of the evidence, when available. | [src/extraction/evidence.ts:28](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/evidence.ts#L28) |
| <a id="source"></a> `source` | [`EvidenceSource`](#evidencesource-1) | Where the evidence came from (page, api, structured data, snippet). | [src/extraction/evidence.ts:20](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/evidence.ts#L20) |
| <a id="type"></a> `type` | [`EvidenceSource`](#evidencesource-1) | The kind of evidence, mirroring [EvidenceSource](#evidencesource-1). | [src/extraction/evidence.ts:22](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/evidence.ts#L22) |
| <a id="url"></a> `url` | `string` | The URL the evidence was extracted from. | [src/extraction/evidence.ts:26](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/evidence.ts#L26) |

***

### FusedContent

Defined in: [src/extraction/evidence.ts:54](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/evidence.ts#L54)

The final fused extraction returned to callers.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="api_endpoints"></a> `api_endpoints` | `unknown` | API endpoint payloads merged from all strategies. | [src/extraction/evidence.ts:73](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/evidence.ts#L73) |
| <a id="content"></a> `content` | `string` | The best content, chosen by confidence. | [src/extraction/evidence.ts:60](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/evidence.ts#L60) |
| <a id="extraction"></a> `extraction` | \{ `confidence`: `number`; `method`: [`FusionMethod`](#fusionmethod); `rendered`: `boolean`; \} | Metadata about the winning extraction method. | [src/extraction/evidence.ts:62](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/evidence.ts#L62) |
| `extraction.confidence` | `number` | The winning method's confidence, 0..1. | [src/extraction/evidence.ts:66](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/evidence.ts#L66) |
| `extraction.method` | [`FusionMethod`](#fusionmethod) | The winning method name. | [src/extraction/evidence.ts:64](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/evidence.ts#L64) |
| `extraction.rendered` | `boolean` | Whether the content required a browser render. | [src/extraction/evidence.ts:68](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/evidence.ts#L68) |
| <a id="metadata"></a> `metadata` | `Record`\<`string`, `string`\> | Page metadata (title, description, published, author, siteName). | [src/extraction/evidence.ts:75](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/evidence.ts#L75) |
| <a id="structured_data"></a> `structured_data` | `unknown` | Structured data merged from all strategies. | [src/extraction/evidence.ts:71](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/evidence.ts#L71) |
| <a id="title"></a> `title` | `string` | The page title. | [src/extraction/evidence.ts:58](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/evidence.ts#L58) |
| <a id="url-1"></a> `url` | `string` | The page URL. | [src/extraction/evidence.ts:56](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/evidence.ts#L56) |

***

### StrategyResult

Defined in: [src/extraction/evidence.ts:40](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/evidence.ts#L40)

A single strategy's contribution to the fused result.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="api_endpoints-1"></a> `api_endpoints?` | `unknown` | API endpoint payloads captured by this strategy. | [src/extraction/evidence.ts:50](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/evidence.ts#L50) |
| <a id="confidence-1"></a> `confidence` | `number` | Confidence in this strategy's content, 0..1. | [src/extraction/evidence.ts:44](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/evidence.ts#L44) |
| <a id="content-1"></a> `content` | `string` | The extracted content (Markdown or plain text). | [src/extraction/evidence.ts:46](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/evidence.ts#L46) |
| <a id="method"></a> `method` | [`FusionMethod`](#fusionmethod) | The extraction method that produced this content. | [src/extraction/evidence.ts:42](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/evidence.ts#L42) |
| <a id="structured_data-1"></a> `structured_data?` | `unknown` | Structured data (JSON-LD / hydration) found by this strategy. | [src/extraction/evidence.ts:48](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/evidence.ts#L48) |

## Type Aliases

### EvidenceSource

> **EvidenceSource** = `"page"` \| `"api"` \| `"structured_data"` \| `"search_snippet"`

Defined in: [src/extraction/evidence.ts:11](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/evidence.ts#L11)

The origin of a piece of extracted evidence.

***

### FusionMethod

> **FusionMethod** = `"api"` \| `"jsonld"` \| `"rendered"` \| `"readability"` \| `"metadata"`

Defined in: [src/extraction/evidence.ts:32](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/evidence.ts#L32)

The extraction strategies the fusion pipeline can score.
