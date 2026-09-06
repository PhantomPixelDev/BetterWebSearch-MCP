---
title: "API: tools/research"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / tools/research

# tools/research

## Interfaces

### Citation

Defined in: [src/tools/research.ts:54](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L54)

A span of a source page that supports the answer.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="citation-1"></a> `citation` | `number` | 1-based index into `sources`. | [src/tools/research.ts:56](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L56) |
| <a id="end"></a> `end` | `number` | Character offset of the quote end. | [src/tools/research.ts:66](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L66) |
| <a id="quote"></a> `quote` | `string` | The supporting text, verbatim from the extracted content. | [src/tools/research.ts:62](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L62) |
| <a id="relevance"></a> `relevance` | `number` | Relevance of the span to the question. Higher is stronger. | [src/tools/research.ts:68](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L68) |
| <a id="start"></a> `start` | `number` | Character offset of the quote within that page's extracted content. | [src/tools/research.ts:64](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L64) |
| <a id="title"></a> `title` | `string` | The source title. | [src/tools/research.ts:60](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L60) |
| <a id="url"></a> `url` | `string` | The source URL the span was taken from. | [src/tools/research.ts:58](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L58) |

***

### ResearchResponse

Defined in: [src/tools/research.ts:71](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L71)

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="answer"></a> `answer` | `string` | - | [src/tools/research.ts:72](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L72) |
| <a id="citations"></a> `citations` | [`Citation`](#citation)[] | The exact spans the answer was assembled from, so an agent can attribute a statement to a span rather than to a whole page. | [src/tools/research.ts:79](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L79) |
| <a id="evidence"></a> `evidence` | \{ `cited_spans`: `number`; `derivative_sources`: `number`; `independent_sources`: `number`; `low_density_sources`: `number`; `query_term_coverage`: `number`; `sources_opened`: `number`; \} | Countable facts about the evidence behind the answer. Every field is something the server measured, not a judgement: there is no language model here to score truth or agreement, and an invented confidence number would be worse than none. An agent can use these to decide whether to research further. | [src/tools/research.ts:95](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L95) |
| `evidence.cited_spans` | `number` | Number of cited spans in `citations`. | [src/tools/research.ts:113](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L113) |
| `evidence.derivative_sources` | `number` | Pages that duplicate another page's content or host. | [src/tools/research.ts:105](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L105) |
| `evidence.independent_sources` | `number` | Distinct content clusters among those pages. Syndicated reprints and multiple pages from one host collapse into a single cluster, so this is the number of genuinely separate accounts. | [src/tools/research.ts:103](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L103) |
| `evidence.low_density_sources` | `number` | Opened pages whose information density fell below [LOW\_DENSITY\_THRESHOLD](#low_density_threshold) — listicles, link farms, and templated filler. Their passages are down-weighted rather than dropped, since a thin page can still hold the one sentence that answers the question. | [src/tools/research.ts:120](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L120) |
| `evidence.query_term_coverage` | `number` | Fraction of the question's content words that appear in the cited passages, 0..1. Low values mean the citations may not address the question, not that the answer is wrong. | [src/tools/research.ts:111](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L111) |
| `evidence.sources_opened` | `number` | Pages actually opened and extracted. | [src/tools/research.ts:97](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L97) |
| <a id="extraction_stats"></a> `extraction_stats` | \{ `avgConfidence`: `number`; `method_counts`: `Record`\<`string`, `number`\>; \} | - | [src/tools/research.ts:122](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L122) |
| `extraction_stats.avgConfidence` | `number` | - | [src/tools/research.ts:124](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L124) |
| `extraction_stats.method_counts` | `Record`\<`string`, `number`\> | - | [src/tools/research.ts:123](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L123) |
| <a id="queries_used"></a> `queries_used` | `string`[] | - | [src/tools/research.ts:74](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L74) |
| <a id="sources"></a> `sources` | [`SearchSource`](search.html#searchsource)[] | - | [src/tools/research.ts:73](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L73) |
| <a id="warnings"></a> `warnings?` | `string`[] | Providers that refused or failed during the search phase. Without this a throttled research run is indistinguishable from a question the web has no answer to. | [src/tools/research.ts:86](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L86) |

***

### SourceIndependence

Defined in: [src/tools/research.ts:44](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L44)

Whether a source is an independent account or a copy of another.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="cluster"></a> `cluster` | `number` | Index of the content cluster this source belongs to. | [src/tools/research.ts:46](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L46) |
| <a id="duplicates"></a> `duplicates` | `number` | How many other opened sources share this cluster. | [src/tools/research.ts:50](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L50) |
| <a id="primary"></a> `primary` | `boolean` | Whether this source is the representative of its cluster. | [src/tools/research.ts:48](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L48) |

## Variables

### LOW\_DENSITY\_THRESHOLD

> `const` **LOW\_DENSITY\_THRESHOLD**: `0.5` = `0.5`

Defined in: [src/tools/research.ts:158](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L158)

Information density below which a page counts as thin.

***

### researchInputSchema

> `const` **researchInputSchema**: \{ `count_per_query`: `ZodDefault`\<`ZodNumber`\>; `depth`: `ZodDefault`\<`ZodEnum`\<\[`"quick"`, `"deep"`\]\>\>; `question`: `ZodString`; `recency_days`: `ZodOptional`\<`ZodNumber`\>; \}

Defined in: [src/tools/research.ts:35](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L35)

Input schema for `web_research`.

#### Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-count_per_query"></a> `count_per_query` | `ZodDefault`\<`ZodNumber`\> | [src/tools/research.ts:39](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L39) |
| <a id="property-depth"></a> `depth` | `ZodDefault`\<`ZodEnum`\<\[`"quick"`, `"deep"`\]\>\> | [src/tools/research.ts:37](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L37) |
| <a id="property-question"></a> `question` | `ZodString` | [src/tools/research.ts:36](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L36) |
| <a id="property-recency_days"></a> `recency_days` | `ZodOptional`\<`ZodNumber`\> | [src/tools/research.ts:38](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L38) |

***

### RESPONSE\_SCHEMA

> `const` **RESPONSE\_SCHEMA**: `2` = `2`

Defined in: [src/tools/research.ts:155](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L155)

Version of the [ResearchResponse](#researchresponse) shape, embedded in the cache key.

Bump this whenever a field is added, removed, or given a new meaning, so an
entry written by an older build can never be served as the current type.

## Functions

### collectCitations()

> **collectCitations**(`pages`, `sources`, `question`, `limit?`, `independence?`, `densities?`): [`Citation`](#citation)[]

Defined in: [src/tools/research.ts:263](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L263)

Pick the spans of the opened pages that actually address the question.

The previous implementation took the first 400 characters of each page and
never looked at the question, so the "answer" was usually page intros and
boilerplate. Passages are now scored against the question with BM25 and the
best ones returned with their offsets, which raises the signal and cuts the
token count, since only matching paragraphs are included.

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `pages` | readonly [`RoutedPage`](../extraction/router.html#routedpage)[] | `undefined` |
| `sources` | readonly [`SearchSource`](search.html#searchsource)[] | `undefined` |
| `question` | `string` | `undefined` |
| `limit` | `number` | `MAX_EXCERPTS` |
| `independence` | readonly [`IndependenceResult`](../ranking/independence.html#independenceresult)[] | `[]` |
| `densities` | readonly `number`[] | `[]` |

#### Returns

[`Citation`](#citation)[]

***

### densityWeight()

> **densityWeight**(`density`): `number`

Defined in: [src/tools/research.ts:167](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L167)

Weight a passage score by its page's information density.

Kept as a multiplier in [0.5, 1] rather than a filter: a listicle can still
carry the one sentence that answers the question, so a thin page is made to
compete at a disadvantage instead of being discarded.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `density` | `number` |

#### Returns

`number`

***

### queryTermCoverage()

> **queryTermCoverage**(`question`, `citations`): `number`

Defined in: [src/tools/research.ts:376](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L376)

Fraction of the question's content words that appear in the cited passages.

A blunt but honest measure of whether the citations engage with the question
at all. It says nothing about correctness, which is not something this
server can determine.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `question` | `string` |
| `citations` | readonly [`Citation`](#citation)[] |

#### Returns

`number`

***

### registerResearch()

> **registerResearch**(`server`, `cache?`): `void`

Defined in: [src/tools/research.ts:532](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L532)

Register the `web_research` tool (alias `deep_search`) on the given MCP server.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `server` | `McpServer` |
| `cache?` | [`Cache`](../utils/cache.html#cache) |

#### Returns

`void`

***

### runResearch()

> **runResearch**(`args`): `Promise`\<[`ResearchResponse`](#researchresponse)\>

Defined in: [src/tools/research.ts:418](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/tools/research.ts#L418)

Run a deep research query and return the spec-shaped response.

Exported separately so tests and the smoke harness can call the handler
logic directly.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `cache?`: [`Cache`](../utils/cache.html#cache); `count_per_query?`: `number`; `depth?`: `"deep"` \| `"quick"`; `question`: `string`; `recency_days?`: `number`; \} |
| `args.cache?` | [`Cache`](../utils/cache.html#cache) |
| `args.count_per_query?` | `number` |
| `args.depth?` | `"deep"` \| `"quick"` |
| `args.question` | `string` |
| `args.recency_days?` | `number` |

#### Returns

`Promise`\<[`ResearchResponse`](#researchresponse)\>
