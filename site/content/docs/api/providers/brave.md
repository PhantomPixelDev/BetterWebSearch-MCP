---
title: "API: providers/brave"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / providers/brave


## Classes

### BraveProvider

Defined in: [src/providers/brave.ts:71](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/providers/brave.ts#L71)

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
| <a id="name"></a> `name` | `readonly` | `"brave"` | `"brave"` | Stable provider identifier (e.g. "brave", "tavily", "duckduckgo"). | [src/providers/brave.ts:72](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/providers/brave.ts#L72) |

#### Methods

##### search()

> **search**(`query`, `opts`): `Promise`\<[`SearchResult`](types.html#searchresult)[]\>

Defined in: [src/providers/brave.ts:74](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/providers/brave.ts#L74)

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

Defined in: [src/providers/brave.ts:15](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/providers/brave.ts#L15)

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
