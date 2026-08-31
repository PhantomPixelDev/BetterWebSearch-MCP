---
title: "API: utils/queries"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / utils/queries


## Functions

### expandQueries()

> **expandQueries**(`question`): `string`[]

Defined in: [src/utils/queries.ts:52](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/queries.ts#L52)

Expand a question into 4-6 unique search variants.

The original question is always first. Each matching synonym group adds a
variant with the term replaced. Variants are deduplicated (case-insensitive)
and the list is capped to 6.

Returns `[""]` for an empty question.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `question` | `string` |

#### Returns

`string`[]
