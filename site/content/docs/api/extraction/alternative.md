---
title: "API: extraction/alternative"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / extraction/alternative


## Interfaces

### AlternativeDeps

Defined in: [src/extraction/alternative.ts:30](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/alternative.ts#L30)

Injectable dependencies, defaulting to the real modules.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="aggregatesearch"></a> `aggregateSearch?` | (`query`, `opts`) => `Promise`\<[`SearchResult`](../providers/types.html#searchresult)[]\> | Search aggregator used for snippet fallback. | [src/extraction/alternative.ts:34](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/alternative.ts#L34) |
| <a id="cache"></a> `cache?` | [`Cache`](../utils/cache.html#cache) | Page cache consulted before fetching each variant. | [src/extraction/alternative.ts:36](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/alternative.ts#L36) |
| <a id="fetchpage"></a> `fetchPage?` | (`url`, `opts`) => `Promise`\<[`FetchedPage`](fetch.html#fetchedpage)\> | Page fetcher used for URL variants. | [src/extraction/alternative.ts:32](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/alternative.ts#L32) |

## Variables

### MAX\_SNIPPET\_CHARS

> `const` **MAX\_SNIPPET\_CHARS**: `200` = `200`

Defined in: [src/extraction/alternative.ts:27](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/alternative.ts#L27)

Maximum snippet length for page-variant evidence.

***

### MAX\_SNIPPETS

> `const` **MAX\_SNIPPETS**: `3` = `3`

Defined in: [src/extraction/alternative.ts:24](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/alternative.ts#L24)

Maximum number of search snippets kept as evidence.

***

### SNIPPET\_CONFIDENCE

> `const` **SNIPPET\_CONFIDENCE**: `0.6` = `0.6`

Defined in: [src/extraction/alternative.ts:18](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/alternative.ts#L18)

Confidence assigned to search-snippet evidence.

***

### VARIANT\_CONFIDENCE

> `const` **VARIANT\_CONFIDENCE**: `0.6` = `0.6`

Defined in: [src/extraction/alternative.ts:21](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/alternative.ts#L21)

Confidence assigned to a successfully fetched URL variant.

## Functions

### buildAlternativeUrls()

> **buildAlternativeUrls**(`url`): `string`[]

Defined in: [src/extraction/alternative.ts:53](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/alternative.ts#L53)

Build the URL variants to try: original, `?output=1`, `/amp`, `?amp`.

Query strings are preserved and extended with `&` when present; the `/amp`
variant is inserted before the query. Returns the original URL alone when
it cannot be parsed.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `url` | `string` |

#### Returns

`string`[]

***

### buildSearchQueries()

> **buildSearchQueries**(`url`, `title`): `string`[]

Defined in: [src/extraction/alternative.ts:78](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/alternative.ts#L78)

Build the search queries for snippet fallback.

With a title: quoted exact title, site-restricted quoted title, and
title + domain keywords. Without a title: a bare `site:` query so the
domain is still searched.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `url` | `string` |
| `title` | `string` \| `null` |

#### Returns

`string`[]

***

### findAlternativeSources()

> **findAlternativeSources**(`url`, `title`, `deps?`): `Promise`\<[`Evidence`](evidence.html#evidence)[]\>

Defined in: [src/extraction/alternative.ts:167](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/alternative.ts#L167)

Discover alternative sources for a blocked or low-confidence page.

1. Tries URL variants (`?output=1`, `/amp`, `?amp`) via [fetchPage](fetch.html#fetchpage),
   cache-aware, returning the first usable variant as page evidence.
2. If every variant is blocked, runs [aggregateSearch](../providers.html#aggregatesearch) with the
   quoted title, a `site:`-restricted query, and title + domain keywords.
3. Treats the top [MAX\_SNIPPETS](#max_snippets) search results as `search_snippet`
   evidence at confidence [SNIPPET\_CONFIDENCE](#snippet_confidence).

Never throws on empty or failing searches — it returns `[]`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `url` | `string` |
| `title` | `string` \| `null` |
| `deps` | [`AlternativeDeps`](#alternativedeps) |

#### Returns

`Promise`\<[`Evidence`](evidence.html#evidence)[]\>
