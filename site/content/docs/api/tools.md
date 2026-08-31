---
title: "API: tools"
weight: 80
draft: false
---

[**better-web-search-mcp**](index.html)

***

[better-web-search-mcp](index.html) / tools

# tools

## Functions

### registerTools()

> **registerTools**(`server`, `cache?`): `void`

Defined in: [src/tools/index.ts:17](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/tools/index.ts#L17)

Registers all MCP tools on the given server.

Each tool module exposes a `register*` function that wires its zod schema
and handler onto the server. A shared cache instance is passed through so
search/news/find results are cached across calls.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `server` | `McpServer` |
| `cache?` | [`Cache`](utils/cache.html#cache) |

#### Returns

`void`
