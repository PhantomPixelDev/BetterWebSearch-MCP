---
title: "API: utils/config"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / utils/config

# utils/config

## Interfaces

### AppConfig

Defined in: [src/utils/config.ts:33](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/utils/config.ts#L33)

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="braveapikey"></a> `braveApiKey` | `string` \| `undefined` | [src/utils/config.ts:34](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/utils/config.ts#L34) |
| <a id="browserenabled"></a> `browserEnabled` | `boolean` | [src/utils/config.ts:39](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/utils/config.ts#L39) |
| <a id="cacheenabled"></a> `cacheEnabled` | `boolean` | [src/utils/config.ts:37](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/utils/config.ts#L37) |
| <a id="cachepath"></a> `cachePath` | `string` | [src/utils/config.ts:38](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/utils/config.ts#L38) |
| <a id="serpapikey"></a> `serpApiKey` | `string` \| `undefined` | [src/utils/config.ts:36](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/utils/config.ts#L36) |
| <a id="tavilyapikey"></a> `tavilyApiKey` | `string` \| `undefined` | [src/utils/config.ts:35](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/utils/config.ts#L35) |

***

### ProviderStatus

Defined in: [src/utils/config.ts:113](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/utils/config.ts#L113)

Shape for the provider banner (pure, testable).

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="enabled"></a> `enabled` | `boolean` | [src/utils/config.ts:115](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/utils/config.ts#L115) |
| <a id="hint"></a> `hint?` | `string` | [src/utils/config.ts:117](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/utils/config.ts#L117) |
| <a id="keyless"></a> `keyless` | `boolean` | [src/utils/config.ts:116](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/utils/config.ts#L116) |
| <a id="name"></a> `name` | `string` | [src/utils/config.ts:114](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/utils/config.ts#L114) |

## Functions

### defaultCachePath()

> **defaultCachePath**(`env?`, `platform?`): `string`

Defined in: [src/utils/config.ts:56](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/utils/config.ts#L56)

Where the cache lives when nothing overrides it.

The default used to be the relative path `data/cache.db`, which resolves
against the working directory. An MCP client spawns the server from
wherever it happens to be, so that scattered `data/cache.db` files around
the filesystem — two were sitting in the home and Downloads folders — and
meant the domain profiles and page cache never accumulated, because every
launch directory got its own empty database. A per-user location is stable
across launches and keeps the writes inside a directory meant for them.

`BETTER_WEB_SEARCH_CACHE_PATH` still overrides, and a relative override is
still honoured for anyone who wants a project-local cache.

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `env` | `ProcessEnv` | `process.env` |
| `platform` | `string` | `process.platform` |

#### Returns

`string`

***

### formatBanner()

> **formatBanner**(`pkg`, `cfg`): `string`

Defined in: [src/utils/config.ts:143](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/utils/config.ts#L143)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `pkg` | \{ `name`: `string`; `version`: `string`; \} |
| `pkg.name` | `string` |
| `pkg.version` | `string` |
| `cfg` | [`AppConfig`](#appconfig) |

#### Returns

`string`

***

### loadConfig()

> **loadConfig**(): [`AppConfig`](#appconfig)

Defined in: [src/utils/config.ts:84](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/utils/config.ts#L84)

#### Returns

[`AppConfig`](#appconfig)

***

### providerStatuses()

> **providerStatuses**(`cfg`): [`ProviderStatus`](#providerstatus)[]

Defined in: [src/utils/config.ts:120](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/utils/config.ts#L120)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `cfg` | [`AppConfig`](#appconfig) |

#### Returns

[`ProviderStatus`](#providerstatus)[]
