---
title: "API: ranking/domainScore"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / ranking/domainScore

# ranking/domainScore

## Functions

### domainScore()

> **domainScore**(`urlOrHost`): `number`

Defined in: [src/ranking/domainScore.ts:76](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/domainScore.ts#L76)

Score a hostname against the curated tiers using suffix matching.

Accepts either a full URL or a bare hostname. Returns a value in [0, 1].

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `urlOrHost` | `string` |

#### Returns

`number`
