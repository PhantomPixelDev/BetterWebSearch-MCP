---
title: "API: extraction/readability"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / extraction/readability


## Interfaces

### ReadabilityResult

Defined in: [src/extraction/readability.ts:15](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/readability.ts#L15)

The result of a readability extraction.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="byline"></a> `byline` | `string` | Author metadata, when present. | [src/extraction/readability.ts:27](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/readability.ts#L27) |
| <a id="contentmarkdown"></a> `contentMarkdown` | `string` | The article content converted to Markdown. | [src/extraction/readability.ts:19](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/readability.ts#L19) |
| <a id="excerpt"></a> `excerpt` | `string` | A short excerpt / description of the article. | [src/extraction/readability.ts:23](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/readability.ts#L23) |
| <a id="length"></a> `length` | `number` | Length of the article in characters. | [src/extraction/readability.ts:25](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/readability.ts#L25) |
| <a id="textcontent"></a> `textContent` | `string` | Plain-text content with all HTML tags removed. | [src/extraction/readability.ts:21](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/readability.ts#L21) |
| <a id="title"></a> `title` | `string` | The article title. | [src/extraction/readability.ts:17](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/readability.ts#L17) |

## Functions

### extractWithReadability()

> **extractWithReadability**(`html`, `url`): [`ReadabilityResult`](#readabilityresult) \| `null`

Defined in: [src/extraction/readability.ts:47](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/readability.ts#L47)

Extract the main article from an HTML page.

1. Cheerio pre-pass removes script/style/link/svg/data-image nodes so they
   never pollute the article or the Markdown output.
2. The cleaned HTML is loaded into JSDOM (with the page URL for correct
   relative-link resolution).
3. Mozilla Readability parses the document into an article.
4. Turndown converts the article HTML to Markdown.

Returns `null` when the page has no readable article (Readability.parse
returns null), so callers can escalate to a different extraction tier.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `html` | `string` |
| `url` | `string` |

#### Returns

[`ReadabilityResult`](#readabilityresult) \| `null`
