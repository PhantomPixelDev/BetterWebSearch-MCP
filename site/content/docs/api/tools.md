---
title: "API: tools"
weight: 80
draft: false
---

[**better-web-search-mcp**](index.html)

***

[better-web-search-mcp](index.html) / tools

# tools

## Functions

### cacheFromConfig()

> **cacheFromConfig**(`cfg?`): [`Cache`](utils/cache.html#cache)

Defined in: [src/tools/index.ts:27](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/index.ts#L27)

Build the shared cache from configuration.

`BETTER_WEB_SEARCH_DISABLE_CACHE` and `BETTER_WEB_SEARCH_CACHE_PATH` were
parsed by the config loader and printed in the startup banner, but nothing
ever passed them to the Cache: the server opened `data/cache.db` no matter
what either said. Both are honored here.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `cfg` | [`AppConfig`](utils/config.html#appconfig) |

#### Returns

[`Cache`](utils/cache.html#cache)

***

### registerTools()

> **registerTools**(`server`, `cache?`): `void`

Defined in: [src/tools/index.ts:34](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/index.ts#L34)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `server` | `McpServer` |
| `cache?` | [`Cache`](utils/cache.html#cache) |

#### Returns

`void`
