---
title: "API: utils/queries"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / utils/queries

# utils/queries

## Functions

### expandQueries()

> **expandQueries**(`question`): `string`[]

Defined in: [src/utils/queries.ts:66](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/utils/queries.ts#L66)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `question` | `string` |

#### Returns

`string`[]

***

### variantKey()

> **variantKey**(`query`): `string`

Defined in: [src/utils/queries.ts:60](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/utils/queries.ts#L60)

A comparison key that ignores differences no search engine cares about.

Case, punctuation and a trailing plural are all collapsed, so "… Type R
review" and "… Type R reviews" reduce to the same key. Without this the
expander emitted both, spending a provider call and a rank slot on a query
that returns the same page twice.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |

#### Returns

`string`
