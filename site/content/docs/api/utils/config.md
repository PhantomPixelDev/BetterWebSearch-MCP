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

Defined in: [src/utils/config.ts:31](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/config.ts#L31)

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="braveapikey"></a> `braveApiKey` | `string` \| `undefined` | [src/utils/config.ts:32](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/config.ts#L32) |
| <a id="browserenabled"></a> `browserEnabled` | `boolean` | [src/utils/config.ts:37](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/config.ts#L37) |
| <a id="cacheenabled"></a> `cacheEnabled` | `boolean` | [src/utils/config.ts:35](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/config.ts#L35) |
| <a id="cachepath"></a> `cachePath` | `string` | [src/utils/config.ts:36](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/config.ts#L36) |
| <a id="serpapikey"></a> `serpApiKey` | `string` \| `undefined` | [src/utils/config.ts:34](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/config.ts#L34) |
| <a id="tavilyapikey"></a> `tavilyApiKey` | `string` \| `undefined` | [src/utils/config.ts:33](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/config.ts#L33) |

***

### ProviderStatus

Defined in: [src/utils/config.ts:69](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/config.ts#L69)

Shape for the provider banner (pure, testable).

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="enabled"></a> `enabled` | `boolean` | [src/utils/config.ts:71](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/config.ts#L71) |
| <a id="hint"></a> `hint?` | `string` | [src/utils/config.ts:73](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/config.ts#L73) |
| <a id="keyless"></a> `keyless` | `boolean` | [src/utils/config.ts:72](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/config.ts#L72) |
| <a id="name"></a> `name` | `string` | [src/utils/config.ts:70](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/config.ts#L70) |

## Functions

### formatBanner()

> **formatBanner**(`pkg`, `cfg`): `string`

Defined in: [src/utils/config.ts:105](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/config.ts#L105)

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

Defined in: [src/utils/config.ts:40](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/config.ts#L40)

#### Returns

[`AppConfig`](#appconfig)

***

### providerStatuses()

> **providerStatuses**(`cfg`): [`ProviderStatus`](#providerstatus)[]

Defined in: [src/utils/config.ts:76](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/config.ts#L76)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `cfg` | [`AppConfig`](#appconfig) |

#### Returns

[`ProviderStatus`](#providerstatus)[]
