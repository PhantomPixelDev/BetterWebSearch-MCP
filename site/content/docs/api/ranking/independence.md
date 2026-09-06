---
title: "API: ranking/independence"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / ranking/independence

# ranking/independence

## Interfaces

### IndependenceInput

Defined in: [src/ranking/independence.ts:30](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/independence.ts#L30)

A document participating in independence analysis.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="content"></a> `content` | `string` | The extracted page content. | [src/ranking/independence.ts:34](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/independence.ts#L34) |
| <a id="url"></a> `url` | `string` | The source URL, used to derive the registrable-ish host. | [src/ranking/independence.ts:32](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/independence.ts#L32) |

***

### IndependenceResult

Defined in: [src/ranking/independence.ts:38](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/independence.ts#L38)

Where a document sits among its near-duplicates.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="cluster"></a> `cluster` | `number` | Index of the cluster this document belongs to. | [src/ranking/independence.ts:40](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/independence.ts#L40) |
| <a id="contentduplicate"></a> `contentDuplicate` | `boolean` | Whether this document's *text* duplicates another in the cluster, as opposed to merely sharing a host. The distinction matters because the two facts support different decisions. For counting corroboration, two articles on one site are one account. For gathering evidence they are not interchangeable: a second article on the same host is different writing that may hold the answer, and discarding it loses real material, whereas a syndicated reprint adds nothing to quote. | [src/ranking/independence.ts:59](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/independence.ts#L59) |
| <a id="duplicates"></a> `duplicates` | `number` | How many other documents share this cluster. | [src/ranking/independence.ts:47](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/independence.ts#L47) |
| <a id="primary"></a> `primary` | `boolean` | Whether this is the representative of its cluster. Exactly one document per cluster is primary; the rest are derivative copies of the same text. | [src/ranking/independence.ts:45](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/independence.ts#L45) |

## Variables

### DUPLICATE\_THRESHOLD

> `const` **DUPLICATE\_THRESHOLD**: `0.4` = `0.4`

Defined in: [src/ranking/independence.ts:24](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/independence.ts#L24)

Jaccard similarity at or above which two documents are near-duplicates.

***

### SHINGLE\_SIZE

> `const` **SHINGLE\_SIZE**: `5` = `5`

Defined in: [src/ranking/independence.ts:21](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/independence.ts#L21)

Words per shingle. Long enough to be distinctive, short enough to survive edits.

## Functions

### analyzeIndependence()

> **analyzeIndependence**(`docs`): [`IndependenceResult`](#independenceresult)[]

Defined in: [src/ranking/independence.ts:129](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/independence.ts#L129)

Group documents into clusters of near-duplicates.

Two documents join the same cluster when their shingle sets reach
[DUPLICATE\_THRESHOLD](#duplicate_threshold), or when they share a host — the same site
publishing two pages on a topic is not two independent confirmations.
Clustering is transitive via union-find, so A~B and B~C puts all three
together even when A and C alone fall below the threshold.

The first document in each cluster is its primary, which keeps the incoming
relevance order meaningful: callers rank before calling this.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `docs` | readonly [`IndependenceInput`](#independenceinput)[] | Documents in the caller's preferred (usually ranked) order. |

#### Returns

[`IndependenceResult`](#independenceresult)[]

One result per input document, in the same order.

***

### countIndependent()

> **countIndependent**(`results`): `number`

Defined in: [src/ranking/independence.ts:215](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/independence.ts#L215)

How many distinct clusters a set of independence results spans.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `results` | readonly [`IndependenceResult`](#independenceresult)[] |

#### Returns

`number`

***

### hostOf()

> **hostOf**(`url`): `string`

Defined in: [src/ranking/independence.ts:106](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/independence.ts#L106)

The host of a URL, lowercased and stripped of a leading `www.`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `url` | `string` |

#### Returns

`string`

***

### jaccard()

> **jaccard**(`a`, `b`): `number`

Defined in: [src/ranking/independence.ts:90](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/independence.ts#L90)

Jaccard similarity of two sets: |intersection| / |union|.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `a` | `ReadonlySet`\<`string`\> |
| `b` | `ReadonlySet`\<`string`\> |

#### Returns

`number`

***

### shingles()

> **shingles**(`text`, `size?`): `Set`\<`string`\>

Defined in: [src/ranking/independence.ts:72](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/independence.ts#L72)

Build the set of word shingles for a document.

Exported for testing; callers normally use [analyzeIndependence](#analyzeindependence).

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `text` | `string` | `undefined` |
| `size` | `number` | `SHINGLE_SIZE` |

#### Returns

`Set`\<`string`\>
