---
title: "API: ranking/density"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / ranking/density

# ranking/density

## Interfaces

### DensityResult

Defined in: [src/ranking/density.ts:32](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/density.ts#L32)

A density verdict for one page.

#### Extends

- [`DensitySignals`](#densitysignals)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="boilerplateratio"></a> `boilerplateRatio` | `number` | Share of lines that look like navigation or boilerplate, 0..1. | [`DensitySignals`](#densitysignals).[`boilerplateRatio`](#boilerplateratio-1) | [src/ranking/density.ts:26](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/density.ts#L26) |
| <a id="duplicateratio"></a> `duplicateRatio` | `number` | Share of paragraphs that duplicate an earlier one, 0..1. | [`DensitySignals`](#densitysignals).[`duplicateRatio`](#duplicateratio-1) | [src/ranking/density.ts:24](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/density.ts#L24) |
| <a id="linkratio"></a> `linkRatio` | `number` | Markdown links per 100 words. High on navigation and affiliate pages. | [`DensitySignals`](#densitysignals).[`linkRatio`](#linkratio-1) | [src/ranking/density.ts:22](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/density.ts#L22) |
| <a id="meansentencewords"></a> `meanSentenceWords` | `number` | Mean sentence length in words. | [`DensitySignals`](#densitysignals).[`meanSentenceWords`](#meansentencewords-1) | [src/ranking/density.ts:28](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/density.ts#L28) |
| <a id="score"></a> `score` | `number` | Information density, 0..1. Higher means more substance per character. Intended as a ranking signal alongside relevance, not a gate. | - | [src/ranking/density.ts:37](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/density.ts#L37) |
| <a id="words"></a> `words` | `number` | Words of visible text, after stripping markdown link syntax. | [`DensitySignals`](#densitysignals).[`words`](#words-1) | [src/ranking/density.ts:20](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/density.ts#L20) |

***

### DensitySignals

Defined in: [src/ranking/density.ts:18](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/density.ts#L18)

The component signals behind a density score.

#### Extended by

- [`DensityResult`](#densityresult)

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="boilerplateratio-1"></a> `boilerplateRatio` | `number` | Share of lines that look like navigation or boilerplate, 0..1. | [src/ranking/density.ts:26](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/density.ts#L26) |
| <a id="duplicateratio-1"></a> `duplicateRatio` | `number` | Share of paragraphs that duplicate an earlier one, 0..1. | [src/ranking/density.ts:24](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/density.ts#L24) |
| <a id="linkratio-1"></a> `linkRatio` | `number` | Markdown links per 100 words. High on navigation and affiliate pages. | [src/ranking/density.ts:22](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/density.ts#L22) |
| <a id="meansentencewords-1"></a> `meanSentenceWords` | `number` | Mean sentence length in words. | [src/ranking/density.ts:28](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/density.ts#L28) |
| <a id="words-1"></a> `words` | `number` | Words of visible text, after stripping markdown link syntax. | [src/ranking/density.ts:20](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/density.ts#L20) |

## Functions

### densitySignals()

> **densitySignals**(`content`): [`DensitySignals`](#densitysignals)

Defined in: [src/ranking/density.ts:68](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/density.ts#L68)

Measure the structural signals of a page's extracted content.

Exported so the score can be explained rather than just asserted.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `content` | `string` |

#### Returns

[`DensitySignals`](#densitysignals)

***

### informationDensity()

> **informationDensity**(`content`): [`DensityResult`](#densityresult)

Defined in: [src/ranking/density.ts:162](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/density.ts#L162)

Score a page's information density from its extracted content.

Penalties are additive and capped, so one bad signal cannot zero a page that
is otherwise substantial. An empty page scores 0.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `content` | `string` |

#### Returns

[`DensityResult`](#densityresult)

***

### looksLikeSerializedData()

> **looksLikeSerializedData**(`text`): `boolean`

Defined in: [src/ranking/density.ts:138](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/ranking/density.ts#L138)

Whether text is a serialized data blob rather than readable content.

Extraction sometimes leaves `__NEXT_DATA__`-style payloads in the page text,
and they score well: they repeat every query term the article uses, so they
won citation slots and spent an agent's context on `{"props":{"pageProps"…`.
Quoting one is pure waste, since nothing in it is prose an agent can read.

The test is deliberately narrow. A fenced code sample or a config snippet is
legitimate evidence for a developer question, so it requires both a high
punctuation share and the quoted-key shape that marks JSON.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |

#### Returns

`boolean`
