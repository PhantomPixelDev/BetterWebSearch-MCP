---
title: "API: ranking/deduplicate"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / ranking/deduplicate

# ranking/deduplicate

## Functions

### deduplicate()

> **deduplicate**(`results`): [`SearchResult`](../providers/types.html#searchresult)[]

Defined in: [src/ranking/deduplicate.ts:53](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/ranking/deduplicate.ts#L53)

Deduplicate search results by normalized URL, keeping the highest score
for each canonical URL. Malformed URLs are skipped, not thrown.

Does not mutate the input array.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `results` | readonly [`SearchResult`](../providers/types.html#searchresult)[] |

#### Returns

[`SearchResult`](../providers/types.html#searchresult)[]

***

### normalizeUrl()

> **normalizeUrl**(`rawUrl`): `string` \| `undefined`

Defined in: [src/ranking/deduplicate.ts:18](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/ranking/deduplicate.ts#L18)

Normalize a URL to a canonical form suitable for deduplication.

- Lowercases the hostname.
- Strips `utm_*`, `gclid`, and `fbclid` query parameters.
- Sorts the remaining query parameters for stable ordering.
- Removes a trailing slash except for the root path.
- Drops the hash/fragment.

Returns `undefined` for malformed URLs so callers can skip them rather
than throw.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `rawUrl` | `string` |

#### Returns

`string` \| `undefined`
