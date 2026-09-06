---
title: "API: extraction/hydration"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / extraction/hydration

# extraction/hydration

## Interfaces

### HydrationSummary

Defined in: [src/extraction/hydration.ts:108](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/hydration.ts#L108)

What a hydration source contributed, without the payload itself.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="present"></a> `present` | `string`[] | Which hydration containers were present on the page. | [src/extraction/hydration.ts:110](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/hydration.ts#L110) |
| <a id="readable_chars"></a> `readable_chars` | `number` | Characters of readable text recovered from them into the page content. | [src/extraction/hydration.ts:112](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/hydration.ts#L112) |

***

### PublishableStructured

Defined in: [src/extraction/hydration.ts:116](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/hydration.ts#L116)

The structured data a response carries, with payloads summarized away.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="hydration"></a> `hydration` | [`HydrationSummary`](#hydrationsummary) | What hydration containers held, rather than what they contained. | [src/extraction/hydration.ts:120](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/hydration.ts#L120) |
| <a id="jsonld"></a> `jsonLd` | `unknown`[] | Schema.org entities found on the page, capped in size. | [src/extraction/hydration.ts:118](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/hydration.ts#L118) |

## Variables

### MAX\_HYDRATION\_CHARS

> `const` **MAX\_HYDRATION\_CHARS**: `20000` = `20_000`

Defined in: [src/extraction/hydration.ts:32](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/hydration.ts#L32)

Cap on extracted text, so one payload cannot dominate a page.

***

### MAX\_JSONLD\_CHARS

> `const` **MAX\_JSONLD\_CHARS**: `8000` = `8_000`

Defined in: [src/extraction/hydration.ts:20](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/hydration.ts#L20)

Cap on the JSON-LD kept in a response, in serialized characters.

## Functions

### hydrationText()

> **hydrationText**(`data`): `string`

Defined in: [src/extraction/hydration.ts:72](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/hydration.ts#L72)

Pull the readable text out of a hydration payload.

Duplicate strings are dropped, since payloads routinely carry the same
summary under several keys, and the total is capped so a single page cannot
flood a research response.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `unknown` | The parsed hydration payload. |

#### Returns

`string`

Prose found in the payload, joined by blank lines.

***

### isReadableString()

> **isReadableString**(`value`): `boolean`

Defined in: [src/extraction/hydration.ts:54](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/hydration.ts#L54)

Whether a string from a payload reads as content.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

#### Returns

`boolean`

***

### publishableStructured()

> **publishableStructured**(`data`, `readableChars?`): [`PublishableStructured`](#publishablestructured) \| `undefined`

Defined in: [src/extraction/hydration.ts:149](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/hydration.ts#L149)

Reduce extracted structured data to something worth sending to an agent.

Fixing the page `content` was only half the problem. The response also
carried the raw payload under `structured_data`, so `web_extract` on a
Next.js page still shipped about 80KB of `{"props":{"pageProps"…` — the
content field was clean while the response was not. A live run through an
MCP client is what surfaced it; module-level tests had only ever checked
`content`.

JSON-LD is kept, since schema.org entities are small and directly useful.
Hydration containers are replaced by a note of which were present: their
readable text has already been lifted into the page content by
[hydrationText](#hydrationtext), so the payload itself has no remaining consumer.

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `data` | `StructuredLike` \| `undefined` | `undefined` |
| `readableChars` | `number` | `0` |

#### Returns

[`PublishableStructured`](#publishablestructured) \| `undefined`

***

### stripTags()

> **stripTags**(`value`): `string`

Defined in: [src/extraction/hydration.ts:38](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/hydration.ts#L38)

Remove tags and decode the few entities that matter, then collapse space.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

#### Returns

`string`
