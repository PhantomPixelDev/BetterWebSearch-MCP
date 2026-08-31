---
title: "API: extraction/fusion"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / extraction/fusion


## Functions

### fuseContent()

> **fuseContent**(`url`, `title`, `strategiesResults`, `metadata?`): [`FusedContent`](evidence.html#fusedcontent)

Defined in: [src/extraction/fusion.ts:118](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/fusion.ts#L118)

Fuse the results of several extraction strategies into one page extraction.

The strategy with the highest effective confidence and non-empty content
becomes the primary body. Structured data and API endpoints from every
strategy are merged into the returned object regardless of which strategy
won the content race.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `url` | `string` | The page URL the strategies were run against. |
| `title` | `string` | The page title, when known. |
| `strategiesResults` | readonly [`StrategyResult`](evidence.html#strategyresult)[] | The per-strategy extraction results. |
| `metadata` | `Record`\<`string`, `string`\> | Page metadata (title, description, published, author, siteName) to attach to the result. |

#### Returns

[`FusedContent`](evidence.html#fusedcontent)
