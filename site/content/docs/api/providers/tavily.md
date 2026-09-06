---
title: "API: providers/tavily"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / providers/tavily

# providers/tavily

## Classes

### TavilyProvider

Defined in: [src/providers/tavily.ts:27](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/providers/tavily.ts#L27)

Tavily Search provider (optional).

Requires `TAVILY_API_KEY` in the environment. When the key is missing or
the request fails, it returns an empty array and logs a warning rather
than throwing.

#### Implements

- [`SearchProvider`](types.html#searchprovider)

#### Constructors

##### Constructor

> **new TavilyProvider**(): [`TavilyProvider`](#tavilyprovider)

###### Returns

[`TavilyProvider`](#tavilyprovider)

#### Properties

| Property | Modifier | Type | Default value | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="name"></a> `name` | `readonly` | `"tavily"` | `"tavily"` | Stable provider identifier (e.g. "brave", "tavily", "duckduckgo"). | [src/providers/tavily.ts:28](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/providers/tavily.ts#L28) |

#### Methods

##### search()

> **search**(`query`, `opts`): `Promise`\<[`SearchResult`](types.html#searchresult)[]\>

Defined in: [src/providers/tavily.ts:30](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/providers/tavily.ts#L30)

Run a search and return normalized results.

Implementations MUST NOT throw on provider errors (missing key, HTTP
401/429, timeout). They return an empty array and log a warning instead,
so one failing provider never breaks the aggregate search.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |
| `opts` | [`SearchOptions`](types.html#searchoptions) |

###### Returns

`Promise`\<[`SearchResult`](types.html#searchresult)[]\>

###### Implementation of

[`SearchProvider`](types.html#searchprovider).[`search`](types.html#search)
