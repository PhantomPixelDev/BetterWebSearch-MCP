---
title: "API: utils/memoryCache"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / utils/memoryCache

# utils/memoryCache

## Classes

### MemoryCache

Defined in: [src/utils/memoryCache.ts:24](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/memoryCache.ts#L24)

A cache backend backed by a plain `Map`.

Search entries expire after [SEARCH\_TTL\_MS](cacheTypes.html#search_ttl_ms), page entries after
[PAGE\_TTL\_MS](cacheTypes.html#page_ttl_ms); domain profiles and API patterns never expire.

#### Constructors

##### Constructor

> **new MemoryCache**(): [`MemoryCache`](#memorycache)

###### Returns

[`MemoryCache`](#memorycache)

#### Methods

##### addApiPattern()

> **addApiPattern**(`domain`, `endpointPattern`, `method`, `contentType`): `void`

Defined in: [src/utils/memoryCache.ts:76](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/memoryCache.ts#L76)

Record a discovered API endpoint pattern for a domain.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `domain` | `string` |
| `endpointPattern` | `string` |
| `method` | `string` |
| `contentType` | `string` |

###### Returns

`void`

##### clear()

> **clear**(): `void`

Defined in: [src/utils/memoryCache.ts:28](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/memoryCache.ts#L28)

Drop every entry (used on close).

###### Returns

`void`

##### getApiPatterns()

> **getApiPatterns**(`domain`): [`ApiPattern`](cacheTypes.html#apipattern)[]

Defined in: [src/utils/memoryCache.ts:99](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/memoryCache.ts#L99)

List all API patterns for a domain, newest first.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `domain` | `string` |

###### Returns

[`ApiPattern`](cacheTypes.html#apipattern)[]

##### getDomain()

> **getDomain**(`domain`): `unknown`

Defined in: [src/utils/memoryCache.ts:66](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/memoryCache.ts#L66)

Read a cached domain profile, or `null` on miss.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `domain` | `string` |

###### Returns

`unknown`

##### getPage()

> **getPage**(`url`): [`PageCacheEntry`](cacheTypes.html#pagecacheentry) \| `null`

Defined in: [src/utils/memoryCache.ts:43](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/memoryCache.ts#L43)

Read a cached page entry, or `null` on miss / expiry.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `url` | `string` |

###### Returns

[`PageCacheEntry`](cacheTypes.html#pagecacheentry) \| `null`

##### getSearch()

> **getSearch**(`key`): `unknown`

Defined in: [src/utils/memoryCache.ts:33](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/memoryCache.ts#L33)

Read a search result, or `null` on miss / expiry.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |

###### Returns

`unknown`

##### pruneExpired()

> **pruneExpired**(): `void`

Defined in: [src/utils/memoryCache.ts:108](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/memoryCache.ts#L108)

Delete every search/page entry whose TTL has expired.

###### Returns

`void`

##### setDomain()

> **setDomain**(`domain`, `profile`): `void`

Defined in: [src/utils/memoryCache.ts:71](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/memoryCache.ts#L71)

Upsert a domain profile.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `domain` | `string` |
| `profile` | `unknown` |

###### Returns

`void`

##### setPage()

> **setPage**(`url`, `content`, `extractionMethod`, `confidence`): `void`

Defined in: [src/utils/memoryCache.ts:49](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/memoryCache.ts#L49)

Store a page extraction, refreshing the TTL on overwrite.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `url` | `string` |
| `content` | `string` |
| `extractionMethod` | `string` |
| `confidence` | `number` |

###### Returns

`void`

##### setSearch()

> **setSearch**(`key`, `_query`, `results`): `void`

Defined in: [src/utils/memoryCache.ts:38](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/memoryCache.ts#L38)

Store a search result, refreshing the TTL on overwrite.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |
| `_query` | `string` |
| `results` | `unknown` |

###### Returns

`void`
