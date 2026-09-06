---
title: "API: providers/brave"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / providers/brave

# providers/brave

## Classes

### BraveProvider

Defined in: [src/providers/brave.ts:80](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/providers/brave.ts#L80)

Brave Search provider (primary).

Requires `BRAVE_API_KEY` in the environment. When the key is missing, or
the API returns an auth/rate-limit error, it returns an empty array and
logs a warning rather than throwing.

#### Implements

- [`SearchProvider`](types.html#searchprovider)

#### Constructors

##### Constructor

> **new BraveProvider**(): [`BraveProvider`](#braveprovider)

###### Returns

[`BraveProvider`](#braveprovider)

#### Properties

| Property | Modifier | Type | Default value | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="name"></a> `name` | `readonly` | `"brave"` | `"brave"` | Stable provider identifier (e.g. "brave", "tavily", "duckduckgo"). | [src/providers/brave.ts:81](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/providers/brave.ts#L81) |

#### Methods

##### search()

> **search**(`query`, `opts`): `Promise`\<[`SearchResult`](types.html#searchresult)[]\>

Defined in: [src/providers/brave.ts:83](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/providers/brave.ts#L83)

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

## Functions

### freshnessFromRecencyDays()

> **freshnessFromRecencyDays**(`days`): `string` \| `undefined`

Defined in: [src/providers/brave.ts:24](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/providers/brave.ts#L24)

Map a number of days to a Brave `freshness` filter value.

Brave accepts "pd" (past day), "pw" (past week), "pm" (past month),
"py" (past year), or an explicit "YYYY-MM-DDtoYYYY-MM-DD" range. We map
common day counts to the coarse tokens and fall back to a date range for
anything else.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `days` | `number` |

#### Returns

`string` \| `undefined`
