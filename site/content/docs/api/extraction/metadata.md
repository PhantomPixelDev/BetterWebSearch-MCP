---
title: "API: extraction/metadata"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / extraction/metadata


## Interfaces

### PageMetadata

Defined in: [src/extraction/metadata.ts:12](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/metadata.ts#L12)

The result of a metadata extraction.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="author"></a> `author` | `string` | Author from `article:author` / `meta[name=author]`. | [src/extraction/metadata.ts:20](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/metadata.ts#L20) |
| <a id="description"></a> `description` | `string` | Description from `og:description` or `meta[name=description]`. | [src/extraction/metadata.ts:16](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/metadata.ts#L16) |
| <a id="published"></a> `published` | `string` | Published date from `article:published_time` / `datePublished`. | [src/extraction/metadata.ts:18](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/metadata.ts#L18) |
| <a id="sitename"></a> `siteName` | `string` | Site name from `og:site_name`. | [src/extraction/metadata.ts:22](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/metadata.ts#L22) |
| <a id="title"></a> `title` | `string` | The `<title>` tag text. | [src/extraction/metadata.ts:14](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/metadata.ts#L14) |

## Functions

### extractMetadata()

> **extractMetadata**(`html`): [`PageMetadata`](#pagemetadata)

Defined in: [src/extraction/metadata.ts:36](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/metadata.ts#L36)

Extract page metadata from raw HTML.

All fields are optional and default to an empty string when absent, so
this never throws on sparse or malformed documents.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `html` | `string` |

#### Returns

[`PageMetadata`](#pagemetadata)
