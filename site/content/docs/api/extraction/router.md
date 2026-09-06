---
title: "API: extraction/router"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / extraction/router

# extraction/router

## Interfaces

### GetPageOptions

Defined in: [src/extraction/router.ts:76](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L76)

Options controlling the escalation pipeline.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="browser_fallback"></a> `browser_fallback?` | `boolean` | Whether to fall back to a browser render when HTTP is insufficient. | [src/extraction/router.ts:84](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L84) |
| <a id="include_api_data"></a> `include_api_data?` | `boolean` | Whether to include API data captured during a browser render. | [src/extraction/router.ts:80](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L80) |
| <a id="include_structured_data"></a> `include_structured_data?` | `boolean` | Whether to attempt structured / hydration data extraction. | [src/extraction/router.ts:82](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L82) |
| <a id="mode"></a> `mode?` | `"auto"` \| `"browser"` \| `"fast"` | `auto` escalates; `fast` skips the browser; `browser` forces it. | [src/extraction/router.ts:78](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L78) |

***

### RoutedPage

Defined in: [src/extraction/router.ts:49](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L49)

The page extraction returned by [getPage](#getpage).

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="api_endpoints"></a> `api_endpoints` | `unknown` | API endpoint payloads captured during a browser render. | [src/extraction/router.ts:68](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L68) |
| <a id="content"></a> `content` | `string` | The extracted content (Markdown or plain text). | [src/extraction/router.ts:55](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L55) |
| <a id="evidence"></a> `evidence?` | [`Evidence`](evidence.html#evidence)[] | Alternative-source evidence appended when the primary extraction was blocked. | [src/extraction/router.ts:72](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L72) |
| <a id="extraction"></a> `extraction` | \{ `confidence`: `number`; `method`: [`RouterMethod`](#routermethod); `rendered`: `boolean`; \} | Metadata about the winning extraction method. | [src/extraction/router.ts:57](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L57) |
| `extraction.confidence` | `number` | Confidence in the content, 0..1. | [src/extraction/router.ts:61](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L61) |
| `extraction.method` | [`RouterMethod`](#routermethod) | The method that produced the content. | [src/extraction/router.ts:59](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L59) |
| `extraction.rendered` | `boolean` | Whether a browser render was required. | [src/extraction/router.ts:63](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L63) |
| <a id="metadata"></a> `metadata` | [`PageMetadata`](metadata.html#pagemetadata) | Page metadata (title, description, published, author, siteName). | [src/extraction/router.ts:70](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L70) |
| <a id="structured_data"></a> `structured_data` | `unknown` | Structured data (JSON-LD / hydration) found on the page. | [src/extraction/router.ts:66](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L66) |
| <a id="title"></a> `title` | `string` | The page title. | [src/extraction/router.ts:53](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L53) |
| <a id="url"></a> `url` | `string` | The page URL. | [src/extraction/router.ts:51](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L51) |

***

### RouterDeps

Defined in: [src/extraction/router.ts:88](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L88)

Injectable dependencies, defaulting to the real modules.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="browserpool"></a> `browserPool?` | [`BrowserPool`](browser.html#browserpool) | - | [src/extraction/router.ts:90](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L90) |
| <a id="cache"></a> `cache?` | [`Cache`](../utils/cache.html#cache) | - | [src/extraction/router.ts:89](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L89) |
| <a id="extractmetadata"></a> `extractMetadata?` | (`html`) => [`PageMetadata`](metadata.html#pagemetadata) | - | [src/extraction/router.ts:94](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L94) |
| <a id="extractstructureddata"></a> `extractStructuredData?` | (`html`) => [`StructuredData`](structured.html#structureddata) | - | [src/extraction/router.ts:93](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L93) |
| <a id="extractwithreadability"></a> `extractWithReadability?` | (`html`, `url`) => [`ReadabilityResult`](readability.html#readabilityresult) \| `null` | - | [src/extraction/router.ts:92](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L92) |
| <a id="fetchpage"></a> `fetchPage?` | (`url`, `opts`) => `Promise`\<[`FetchedPage`](fetch.html#fetchedpage)\> | - | [src/extraction/router.ts:91](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L91) |
| <a id="ssrf"></a> `ssrf?` | [`SsrfDeps`](../utils/ssrf.html#ssrfdeps) | Injectable DNS resolution for the SSRF guard, so tests need no network. | [src/extraction/router.ts:96](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L96) |

## Type Aliases

### RouterMethod

> **RouterMethod** = `"http_fetch"` \| `"hydration_data"` \| `"browser_api_intercept"` \| `"rendered_dom"`

Defined in: [src/extraction/router.ts:42](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L42)

The extraction method chosen by the router.

## Variables

### BEST\_EFFORT\_CONFIDENCE

> `const` **BEST\_EFFORT\_CONFIDENCE**: `0.5` = `0.5`

Defined in: [src/extraction/router.ts:111](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L111)

***

### BROWSER\_API\_CONFIDENCE

> `const` **BROWSER\_API\_CONFIDENCE**: `0.96` = `0.96`

Defined in: [src/extraction/router.ts:109](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L109)

***

### ENOUGH\_CONTENT\_LENGTH

> `const` **ENOUGH\_CONTENT\_LENGTH**: `500` = `500`

Defined in: [src/extraction/router.ts:100](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L100)

Minimum visible-text length (after stripping tags) for Level 1 to win.

***

### HTTP\_FETCH\_CONFIDENCE

> `const` **HTTP\_FETCH\_CONFIDENCE**: `0.85` = `0.85`

Defined in: [src/extraction/router.ts:106](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L106)

Confidence baselines per extraction tier (Level 1..3 + best-effort).

***

### HYDRATION\_CONFIDENCE

> `const` **HYDRATION\_CONFIDENCE**: `0.9` = `0.9`

Defined in: [src/extraction/router.ts:107](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L107)

***

### HYDRATION\_PRODUCT\_CONFIDENCE

> `const` **HYDRATION\_PRODUCT\_CONFIDENCE**: `0.95` = `0.95`

Defined in: [src/extraction/router.ts:108](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L108)

***

### RENDERED\_DOM\_CONFIDENCE

> `const` **RENDERED\_DOM\_CONFIDENCE**: `0.9` = `0.9`

Defined in: [src/extraction/router.ts:110](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L110)

***

### STRUCTURED\_CONTENT\_LENGTH

> `const` **STRUCTURED\_CONTENT\_LENGTH**: `200` = `200`

Defined in: [src/extraction/router.ts:103](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L103)

Minimum structured-content length for Level 2 to win.

## Functions

### closeSharedBrowserPool()

> **closeSharedBrowserPool**(): `Promise`\<`void`\>

Defined in: [src/extraction/router.ts:178](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L178)

Close and forget the shared browser pool (server shutdown, tests).

#### Returns

`Promise`\<`void`\>

***

### getPage()

> **getPage**(`url`, `opts?`, `deps?`): `Promise`\<[`RoutedPage`](#routedpage)\>

Defined in: [src/extraction/router.ts:364](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L364)

Fetch and extract a page, escalating through the three tiers as needed.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `url` | `string` | The page URL to extract. |
| `opts` | [`GetPageOptions`](#getpageoptions) | Escalation options (mode, include flags, browser fallback). |
| `deps` | [`RouterDeps`](#routerdeps) | Injectable dependencies for testing. |

#### Returns

`Promise`\<[`RoutedPage`](#routedpage)\>

***

### hasEnoughContent()

> **hasEnoughContent**(`html`): `boolean`

Defined in: [src/extraction/router.ts:123](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/router.ts#L123)

Whether a page has enough visible text to be useful without a browser.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `html` | `string` |

#### Returns

`boolean`
