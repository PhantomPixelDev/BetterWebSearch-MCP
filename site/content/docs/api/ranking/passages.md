---
title: "API: ranking/passages"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / ranking/passages

# ranking/passages

## Interfaces

### Passage

Defined in: [src/ranking/passages.ts:20](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/passages.ts#L20)

A scored span of text taken from a page.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="end"></a> `end` | `number` | Character offset of the passage end within the source content. | [src/ranking/passages.ts:26](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/passages.ts#L26) |
| <a id="score"></a> `score` | `number` | BM25 score against the query. Higher is more relevant. | [src/ranking/passages.ts:28](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/passages.ts#L28) |
| <a id="start"></a> `start` | `number` | Character offset of the passage start within the source content. | [src/ranking/passages.ts:24](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/passages.ts#L24) |
| <a id="text"></a> `text` | `string` | The passage text, trimmed. | [src/ranking/passages.ts:22](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/passages.ts#L22) |

## Variables

### MAX\_PASSAGE\_CHARS

> `const` **MAX\_PASSAGE\_CHARS**: `1200` = `1_200`

Defined in: [src/ranking/passages.ts:47](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/passages.ts#L47)

Hard ceiling on a single passage, in characters.

Paragraph splitting alone is not enough: plenty of extracted pages contain
no blank lines at all, which made the whole page one passage. A cited
"passage" was then the entire document, and `web_research` returned more
text than reading the pages directly would have. Anything longer than this
is windowed on sentence boundaries.

***

### TARGET\_PASSAGE\_CHARS

> `const` **TARGET\_PASSAGE\_CHARS**: `500` = `500`

Defined in: [src/ranking/passages.ts:36](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/passages.ts#L36)

Target passage size in characters; paragraphs are packed up to this.

## Functions

### expandsAcronym()

> **expandsAcronym**(`text`, `acronym`): `boolean`

Defined in: [src/ranking/passages.ts:121](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/passages.ts#L121)

Whether `text` contains a phrase whose initials spell `acronym`.

"Transport Layer Security" expands TLS; "Atomicity, Consistency, Isolation,
Durability" expands ACID. Separators allow the punctuation these lists are
usually written with, and a short connector word may sit between initials
so "Cross-Origin Resource Sharing" and similar still match.

This exists because the expansion is exactly the text a lexical scorer
cannot find: the sentence that answers "what does TLS stand for" frequently
never repeats the letters TLS, so it shares no term with the query and is
dropped before ranking.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |
| `acronym` | `string` |

#### Returns

`boolean`

***

### findAcronyms()

> **findAcronyms**(`query`): `string`[]

Defined in: [src/ranking/passages.ts:100](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/passages.ts#L100)

Uppercase acronyms appearing in a query, e.g. "TLS" from "What does TLS
stand for?".

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |

#### Returns

`string`[]

***

### isDefinitionQuery()

> **isDefinitionQuery**(`query`): `boolean`

Defined in: [src/ranking/passages.ts:92](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/passages.ts#L92)

Whether the query asks for an acronym's expansion.

"What does DNS stand for?" does; "How does DNS caching work?" does not, and
promoting a definition passage there would bury the answer actually wanted.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |

#### Returns

`boolean`

***

### rankPassages()

> **rankPassages**(`passages`, `query`): [`Passage`](#passage)[]

Defined in: [src/ranking/passages.ts:263](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/passages.ts#L263)

Score `passages` against `query` with BM25 and return them ranked.

Passages that share no query term score 0 and are dropped: returning a
passage with nothing in common with the question is what the old
first-400-characters approach did.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `passages` | readonly [`Passage`](#passage)[] |
| `query` | `string` |

#### Returns

[`Passage`](#passage)[]

***

### selectPassages()

> **selectPassages**(`content`, `query`, `limit?`): [`Passage`](#passage)[]

Defined in: [src/ranking/passages.ts:390](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/passages.ts#L390)

Select the passages of `content` most relevant to `query`.

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `content` | `string` | `undefined` | The extracted page content. |
| `query` | `string` | `undefined` | The user's question. |
| `limit` | `number` | `2` | Maximum passages to return. |

#### Returns

[`Passage`](#passage)[]

***

### splitPassages()

> **splitPassages**(`content`): [`Passage`](#passage)[]

Defined in: [src/ranking/passages.ts:168](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/passages.ts#L168)

Split content into passage-sized chunks on paragraph boundaries.

Markdown from the extraction pipeline is paragraph-separated, so blank lines
are the natural split. Short paragraphs are packed together up to
[TARGET\_PASSAGE\_CHARS](#target_passage_chars) so a one-line heading is not its own passage,
and an over-long paragraph is emitted whole rather than cut mid-sentence.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `content` | `string` |

#### Returns

[`Passage`](#passage)[]

***

### tokenize()

> **tokenize**(`text`): `string`[]

Defined in: [src/ranking/passages.ts:155](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/passages.ts#L155)

Lowercase alphanumeric tokens, stop words removed.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |

#### Returns

`string`[]
