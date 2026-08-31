---
title: "API: utils/cache"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / utils/cache

# utils/cache

## Classes

### Cache

Defined in: [src/utils/cache.ts:92](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/cache.ts#L92)

A cache for search results, pages, API patterns, and domain profiles.

Prefers a SQLite database at `data/cache.db` (WAL mode, auto-created
directory). When better-sqlite3 cannot be loaded, or when `memory: true`
is passed, every method transparently operates on an in-memory Map with
the same TTL semantics.

#### Constructors

##### Constructor

> **new Cache**(`opts?`): [`Cache`](#cache)

Defined in: [src/utils/cache.ts:97](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/cache.ts#L97)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`CacheOptions`](cacheTypes.html#cacheoptions) |

###### Returns

[`Cache`](#cache)

#### Accessors

##### isMemory

###### Get Signature

> **get** **isMemory**(): `boolean`

Defined in: [src/utils/cache.ts:124](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/cache.ts#L124)

Whether this instance is running on the in-memory Map backend.

###### Returns

`boolean`

#### Methods

##### addApiPattern()

> **addApiPattern**(`domain`, `endpointPattern`, `method`, `contentType`): `void`

Defined in: [src/utils/cache.ts:255](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/cache.ts#L255)

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

##### close()

> **close**(): `void`

Defined in: [src/utils/cache.ts:129](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/cache.ts#L129)

Close the underlying database (no-op in memory mode).

###### Returns

`void`

##### getApiPatterns()

> **getApiPatterns**(`domain`): [`ApiPattern`](cacheTypes.html#apipattern)[]

Defined in: [src/utils/cache.ts:275](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/cache.ts#L275)

List all API patterns discovered for a domain, newest first.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `domain` | `string` |

###### Returns

[`ApiPattern`](cacheTypes.html#apipattern)[]

##### getDomain()

> **getDomain**(`domain`): `unknown`

Defined in: [src/utils/cache.ts:222](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/cache.ts#L222)

Read a cached domain profile, or `null` on miss / bad JSON.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `domain` | `string` |

###### Returns

`unknown`

##### getPage()

> **getPage**(`url`): [`PageCacheEntry`](cacheTypes.html#pagecacheentry) \| `null`

Defined in: [src/utils/cache.ts:176](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/cache.ts#L176)

Read a cached page entry, or `null` on miss / expiry.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `url` | `string` |

###### Returns

[`PageCacheEntry`](cacheTypes.html#pagecacheentry) \| `null`

##### getSearch()

> **getSearch**(`key`): `unknown`

Defined in: [src/utils/cache.ts:139](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/cache.ts#L139)

Read a cached search result, or `null` on miss / expiry / bad JSON.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |

###### Returns

`unknown`

##### pruneExpired()

> **pruneExpired**(): `void`

Defined in: [src/utils/cache.ts:290](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/cache.ts#L290)

Delete every search/page row whose TTL has expired.

###### Returns

`void`

##### setDomain()

> **setDomain**(`domain`, `profile`): `void`

Defined in: [src/utils/cache.ts:236](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/cache.ts#L236)

Upsert a domain profile (JSON-serialized), refreshing `updated_at`.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `domain` | `string` |
| `profile` | `unknown` |

###### Returns

`void`

##### setPage()

> **setPage**(`url`, `content`, `extractionMethod`, `confidence`): `void`

Defined in: [src/utils/cache.ts:196](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/cache.ts#L196)

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

> **setSearch**(`key`, `query`, `results`): `void`

Defined in: [src/utils/cache.ts:156](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/cache.ts#L156)

Store a search result under a key, refreshing the TTL on overwrite.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |
| `query` | `string` |
| `results` | `unknown` |

###### Returns

`void`

## References

### ApiPattern

Re-exports [ApiPattern](cacheTypes.html#apipattern)

***

### CacheOptions

Re-exports [CacheOptions](cacheTypes.html#cacheoptions)

***

### PAGE\_TTL\_MS

Re-exports [PAGE_TTL_MS](cacheTypes.html#page_ttl_ms)

***

### PageCacheEntry

Re-exports [PageCacheEntry](cacheTypes.html#pagecacheentry)

***

### SEARCH\_TTL\_MS

Re-exports [SEARCH_TTL_MS](cacheTypes.html#search_ttl_ms)
