---
title: "API: extraction/learn"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / extraction/learn


## Functions

### recordApiPatterns()

> **recordApiPatterns**(`url`, `captured`, `cache`): `void`

Defined in: [src/extraction/learn.ts:59](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/learn.ts#L59)

Record discovered API patterns for a domain after a browser render.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `url` | `string` |
| `captured` | readonly [`CapturedApiResponse`](apiIntercept.html#capturedapiresponse)[] |
| `cache` | [`Cache`](../utils/cache.html#cache) \| `undefined` |

#### Returns

`void`

***

### toBestMethod()

> **toBestMethod**(`method`): [`BestMethod`](../utils/domainProfile.html#bestmethod-1)

Defined in: [src/extraction/learn.ts:21](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/learn.ts#L21)

Map a router method to the domain-profile `best_method` value.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `method` | [`RouterMethod`](router.html#routermethod) |

#### Returns

[`BestMethod`](../utils/domainProfile.html#bestmethod-1)

***

### updateDomainProfile()

> **updateDomainProfile**(`url`, `html`, `method`, `cache`): `void`

Defined in: [src/extraction/learn.ts:34](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/learn.ts#L34)

Update the domain profile after a successful extraction.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `url` | `string` |
| `html` | `string` |
| `method` | [`RouterMethod`](router.html#routermethod) |
| `cache` | [`Cache`](../utils/cache.html#cache) \| `undefined` |

#### Returns

`void`
