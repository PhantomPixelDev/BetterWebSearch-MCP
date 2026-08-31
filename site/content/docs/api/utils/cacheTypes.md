---
title: "API: utils/cacheTypes"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / utils/cacheTypes

# utils/cacheTypes

## Interfaces

### ApiPattern

Defined in: [src/utils/cacheTypes.ts:25](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/cacheTypes.ts#L25)

A discovered API endpoint pattern.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="content_type"></a> `content_type` | `string` | [src/utils/cacheTypes.ts:30](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/cacheTypes.ts#L30) |
| <a id="discovered_at"></a> `discovered_at` | `number` | [src/utils/cacheTypes.ts:31](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/cacheTypes.ts#L31) |
| <a id="domain"></a> `domain` | `string` | [src/utils/cacheTypes.ts:27](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/cacheTypes.ts#L27) |
| <a id="endpoint_pattern"></a> `endpoint_pattern` | `string` | [src/utils/cacheTypes.ts:28](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/cacheTypes.ts#L28) |
| <a id="id"></a> `id` | `number` | [src/utils/cacheTypes.ts:26](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/cacheTypes.ts#L26) |
| <a id="method"></a> `method` | `string` | [src/utils/cacheTypes.ts:29](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/cacheTypes.ts#L29) |

***

### CacheOptions

Defined in: [src/utils/cacheTypes.ts:35](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/cacheTypes.ts#L35)

Options controlling the Cache backend.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="dbpath"></a> `dbPath?` | `string` | Path to the SQLite database file. Defaults to `data/cache.db`. | [src/utils/cacheTypes.ts:37](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/cacheTypes.ts#L37) |
| <a id="memory"></a> `memory?` | `boolean` | Force the in-memory Map backend (used in CI / tests). | [src/utils/cacheTypes.ts:39](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/cacheTypes.ts#L39) |

***

### PageCacheEntry

Defined in: [src/utils/cacheTypes.ts:16](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/cacheTypes.ts#L16)

A cached page entry.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="confidence"></a> `confidence` | `number` | [src/utils/cacheTypes.ts:20](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/cacheTypes.ts#L20) |
| <a id="content"></a> `content` | `string` | [src/utils/cacheTypes.ts:18](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/cacheTypes.ts#L18) |
| <a id="created_at"></a> `created_at` | `number` | [src/utils/cacheTypes.ts:21](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/cacheTypes.ts#L21) |
| <a id="extraction_method"></a> `extraction_method` | `string` | [src/utils/cacheTypes.ts:19](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/cacheTypes.ts#L19) |
| <a id="url"></a> `url` | `string` | [src/utils/cacheTypes.ts:17](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/cacheTypes.ts#L17) |

## Variables

### PAGE\_TTL\_MS

> `const` **PAGE\_TTL\_MS**: `number`

Defined in: [src/utils/cacheTypes.ts:13](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/cacheTypes.ts#L13)

TTL for cached pages, in milliseconds (1 hour).

***

### SEARCH\_TTL\_MS

> `const` **SEARCH\_TTL\_MS**: `number`

Defined in: [src/utils/cacheTypes.ts:10](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/cacheTypes.ts#L10)

TTL for cached search results, in milliseconds (15 minutes).
