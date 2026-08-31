---
title: "API: providers/serpapi"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / providers/serpapi

# providers/serpapi

## Classes

### SerpApiProvider

Defined in: [src/providers/serpapi.ts:10](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/providers/serpapi.ts#L10)

SerpApi provider stub (deferred).

SerpApi integration is not implemented yet. This stub satisfies the
[SearchProvider](types.html#searchprovider) contract so the aggregation layer can include it
without special-casing, but always returns no results.

#### Implements

- [`SearchProvider`](types.html#searchprovider)

#### Constructors

##### Constructor

> **new SerpApiProvider**(): [`SerpApiProvider`](#serpapiprovider)

###### Returns

[`SerpApiProvider`](#serpapiprovider)

#### Properties

| Property | Modifier | Type | Default value | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="name"></a> `name` | `readonly` | `"serpapi"` | `"serpapi"` | Stable provider identifier (e.g. "brave", "tavily", "duckduckgo"). | [src/providers/serpapi.ts:11](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/providers/serpapi.ts#L11) |

#### Methods

##### search()

> **search**(`_query`, `_opts`): `Promise`\<[`SearchResult`](types.html#searchresult)[]\>

Defined in: [src/providers/serpapi.ts:13](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/providers/serpapi.ts#L13)

Run a search and return normalized results.

Implementations MUST NOT throw on provider errors (missing key, HTTP
401/429, timeout). They return an empty array and log a warning instead,
so one failing provider never breaks the aggregate search.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `_query` | `string` |
| `_opts` | [`SearchOptions`](types.html#searchoptions) |

###### Returns

`Promise`\<[`SearchResult`](types.html#searchresult)[]\>

###### Implementation of

[`SearchProvider`](types.html#searchprovider).[`search`](types.html#search)
