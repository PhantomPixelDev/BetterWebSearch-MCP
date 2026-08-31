---
title: "API: utils/retry"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / utils/retry

# utils/retry

## Interfaces

### RetryOptions

Defined in: [src/utils/retry.ts:12](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/retry.ts#L12)

Options controlling [withRetry](#withretry).

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="basems"></a> `baseMs?` | `number` | Base delay in ms for the first retry (default 200). | [src/utils/retry.ts:16](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/retry.ts#L16) |
| <a id="maxretries"></a> `maxRetries?` | `number` | Maximum number of retries after the initial attempt (default 2). | [src/utils/retry.ts:14](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/retry.ts#L14) |
| <a id="retrynetworkerrors"></a> `retryNetworkErrors?` | `boolean` | Also retry thrown errors that carry no HTTP status (network errors). | [src/utils/retry.ts:20](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/retry.ts#L20) |
| <a id="retryon"></a> `retryOn?` | `number`[] | HTTP status codes that trigger a retry (default [429, 503]). | [src/utils/retry.ts:18](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/retry.ts#L18) |

## Functions

### parseRetryAfter()

> **parseRetryAfter**(`value`): `number` \| `undefined`

Defined in: [src/utils/retry.ts:49](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/retry.ts#L49)

Parse a `Retry-After` header value into a delay in milliseconds.

The header is either a number of seconds or an HTTP-date. Returns
`undefined` when the value is absent or unparseable.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` \| `null` \| `undefined` |

#### Returns

`number` \| `undefined`

***

### withRetry()

> **withRetry**\<`T`\>(`fn`, `opts?`): `Promise`\<`T`\>

Defined in: [src/utils/retry.ts:79](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/39f0ecc9250abe3f8ca4441fa791de241cde992a/src/utils/retry.ts#L79)

Run `fn`, retrying on transient failures with exponential backoff.

A failure is retryable when the returned value (or thrown error) carries a
`status` in `opts.retryOn`. When the carrier exposes a `Retry-After`
header, that delay is used instead of the computed backoff. After
`maxRetries` retries the last failure is returned/thrown as-is — callers
decide how to degrade (providers return `[]`).

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `fn` | () => `Promise`\<`T`\> |
| `opts` | [`RetryOptions`](#retryoptions) |

#### Returns

`Promise`\<`T`\>
