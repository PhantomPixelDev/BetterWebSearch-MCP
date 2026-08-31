---
title: "API: extraction/apiIntercept"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / extraction/apiIntercept

# extraction/apiIntercept

## Interfaces

### ApiPatternRow

Defined in: [src/extraction/apiIntercept.ts:145](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/apiIntercept.ts#L145)

An `api_patterns` table row (without the auto-increment id/timestamp).

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="content_type"></a> `content_type` | `string` | [src/extraction/apiIntercept.ts:149](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/apiIntercept.ts#L149) |
| <a id="domain"></a> `domain` | `string` | [src/extraction/apiIntercept.ts:146](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/apiIntercept.ts#L146) |
| <a id="endpoint_pattern"></a> `endpoint_pattern` | `string` | [src/extraction/apiIntercept.ts:147](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/apiIntercept.ts#L147) |
| <a id="method"></a> `method` | `string` | [src/extraction/apiIntercept.ts:148](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/apiIntercept.ts#L148) |

***

### ApiResponse

Defined in: [src/extraction/apiIntercept.ts:30](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/apiIntercept.ts#L30)

The minimal Playwright `Response` surface this module depends on.

#### Methods

##### headers()

> **headers**(): `Record`\<`string`, `string`\>

Defined in: [src/extraction/apiIntercept.ts:33](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/apiIntercept.ts#L33)

###### Returns

`Record`\<`string`, `string`\>

##### json()

> **json**(): `Promise`\<`unknown`\>

Defined in: [src/extraction/apiIntercept.ts:34](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/apiIntercept.ts#L34)

###### Returns

`Promise`\<`unknown`\>

##### request()

> **request**(): \{ `method`: `string`; \}

Defined in: [src/extraction/apiIntercept.ts:32](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/apiIntercept.ts#L32)

###### Returns

\{ `method`: `string`; \}

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `method()` | () => `string` | [src/extraction/apiIntercept.ts:32](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/apiIntercept.ts#L32) |

##### url()

> **url**(): `string`

Defined in: [src/extraction/apiIntercept.ts:31](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/apiIntercept.ts#L31)

###### Returns

`string`

***

### CapturedApiResponse

Defined in: [src/extraction/apiIntercept.ts:12](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/apiIntercept.ts#L12)

A single captured JSON API response.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="contenttype"></a> `contentType` | `string` | The response content-type (e.g. `application/json`). | [src/extraction/apiIntercept.ts:18](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/apiIntercept.ts#L18) |
| <a id="data"></a> `data` | `unknown` | The parsed JSON body. | [src/extraction/apiIntercept.ts:20](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/apiIntercept.ts#L20) |
| <a id="method-1"></a> `method` | `string` | The HTTP method used to request it. | [src/extraction/apiIntercept.ts:16](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/apiIntercept.ts#L16) |
| <a id="url-1"></a> `url` | `string` | The absolute URL of the API endpoint. | [src/extraction/apiIntercept.ts:14](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/apiIntercept.ts#L14) |

***

### CapturedApiResponses

Defined in: [src/extraction/apiIntercept.ts:98](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/apiIntercept.ts#L98)

A handle over the responses captured by [installApiCapture](#installapicapture).

#### Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="captured"></a> `captured` | `readonly` | readonly [`CapturedApiResponse`](#capturedapiresponse)[] | The responses captured so far, in arrival order. | [src/extraction/apiIntercept.ts:100](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/apiIntercept.ts#L100) |

#### Methods

##### remove()

> **remove**(): `void`

Defined in: [src/extraction/apiIntercept.ts:102](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/apiIntercept.ts#L102)

Detach the capture listener from the page.

###### Returns

`void`

***

### CapturePage

Defined in: [src/extraction/apiIntercept.ts:24](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/apiIntercept.ts#L24)

The minimal Playwright `Page` surface this module depends on.

#### Methods

##### off()

> **off**(`event`, `listener`): `unknown`

Defined in: [src/extraction/apiIntercept.ts:26](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/apiIntercept.ts#L26)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `"response"` |
| `listener` | (`response`) => `void` |

###### Returns

`unknown`

##### on()

> **on**(`event`, `listener`): `unknown`

Defined in: [src/extraction/apiIntercept.ts:25](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/apiIntercept.ts#L25)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `"response"` |
| `listener` | (`response`) => `void` |

###### Returns

`unknown`

## Functions

### discoverApiPatterns()

> **discoverApiPatterns**(`domain`, `captured`): [`ApiPatternRow`](#apipatternrow)[]

Defined in: [src/extraction/apiIntercept.ts:113](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/apiIntercept.ts#L113)

Normalize a captured API URL into an `api_patterns` row.

The endpoint pattern replaces numeric path segments with `*` so that
`/api/products/123` becomes `/api/products/*`. The domain is the URL's
hostname. `content_type` is normalized to the bare media type (e.g.
`application/json`).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `domain` | `string` |
| `captured` | readonly [`CapturedApiResponse`](#capturedapiresponse)[] |

#### Returns

[`ApiPatternRow`](#apipatternrow)[]

***

### installApiCapture()

> **installApiCapture**(`page`): [`CapturedApiResponses`](#capturedapiresponses)

Defined in: [src/extraction/apiIntercept.ts:63](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/extraction/apiIntercept.ts#L63)

Install a JSON API capture listener on a page.

Registers a `response` handler that, for every response whose content-type
is `application/json`, reads the body and appends `{url, method,
contentType, data}` to the returned array. The listener is removed when
[CapturedApiResponses.remove](#remove) is called, so a page can be reused
without leaking handlers.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `page` | [`CapturePage`](#capturepage) | The Playwright page to observe. |

#### Returns

[`CapturedApiResponses`](#capturedapiresponses)

A handle exposing the captured responses and a `remove()` that
  detaches the listener.
