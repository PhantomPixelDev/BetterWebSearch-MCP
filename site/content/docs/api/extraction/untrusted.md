---
title: "API: extraction/untrusted"
weight: 80
draft: false
---

[**better-web-search-mcp**](../index.html)

***

[better-web-search-mcp](../index.html) / extraction/untrusted

# extraction/untrusted

## Interfaces

### InjectionFinding

Defined in: [src/extraction/untrusted.ts:18](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/untrusted.ts#L18)

A suspicious span found in extracted content.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="excerpt"></a> `excerpt` | `string` | The matched text, truncated for reporting. | [src/extraction/untrusted.ts:22](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/untrusted.ts#L22) |
| <a id="index"></a> `index` | `number` | Character offset of the match within the content. | [src/extraction/untrusted.ts:24](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/untrusted.ts#L24) |
| <a id="pattern"></a> `pattern` | `string` | Short identifier for the pattern that matched. | [src/extraction/untrusted.ts:20](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/untrusted.ts#L20) |

***

### SecurityReport

Defined in: [src/extraction/untrusted.ts:28](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/untrusted.ts#L28)

The security annotation attached to extracted content.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="findings"></a> `findings` | [`InjectionFinding`](#injectionfinding)[] | The individual matches, capped to keep responses small. | [src/extraction/untrusted.ts:37](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/untrusted.ts#L37) |
| <a id="injection_suspected"></a> `injection_suspected` | `boolean` | Whether any injection pattern matched. | [src/extraction/untrusted.ts:35](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/untrusted.ts#L35) |
| <a id="untrusted"></a> `untrusted` | `true` | Always true. Page content comes from the open web and must be treated as data, never as instructions to the agent. | [src/extraction/untrusted.ts:33](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/untrusted.ts#L33) |

## Variables

### INJECTION\_NOTICE

> `const` **INJECTION\_NOTICE**: `string`

Defined in: [src/extraction/untrusted.ts:132](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/untrusted.ts#L132)

The banner prefixed to content that matched an injection pattern.

## Functions

### annotateContent()

> **annotateContent**(`content`, `report`): \{ `content`: `string`; `report`: [`SecurityReport`](#securityreport); \}

Defined in: [src/extraction/untrusted.ts:146](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/untrusted.ts#L146)

Prefix a warning when content looks like it is addressing the agent, and
return the report with its offsets rebased onto the annotated text.

The page text itself is left intact below the banner so the extraction stays
faithful to the source. The offsets have to move with it: a finding index
measured against the raw page lands inside the banner once the banner is
prepended, pointing an agent at the wrong span.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `content` | `string` |
| `report` | [`SecurityReport`](#securityreport) |

#### Returns

\{ `content`: `string`; `report`: [`SecurityReport`](#securityreport); \}

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `content` | `string` | [src/extraction/untrusted.ts:149](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/untrusted.ts#L149) |
| `report` | [`SecurityReport`](#securityreport) | [src/extraction/untrusted.ts:149](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/untrusted.ts#L149) |

***

### detectInjection()

> **detectInjection**(`content`): [`InjectionFinding`](#injectionfinding)[]

Defined in: [src/extraction/untrusted.ts:96](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/untrusted.ts#L96)

Scan content for prompt-injection patterns.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `content` | `string` | The extracted page text. |

#### Returns

[`InjectionFinding`](#injectionfinding)[]

Findings in document order, capped at MAX\_FINDINGS.

***

### screenContent()

> **screenContent**(`content`): [`SecurityReport`](#securityreport)

Defined in: [src/extraction/untrusted.ts:122](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/blob/da17f6df13d1658b23a75477acaf16c30d00e35e/src/extraction/untrusted.ts#L122)

Build the security annotation for a page's extracted content.

Content is returned unchanged; only the annotation is derived from it.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `content` | `string` |

#### Returns

[`SecurityReport`](#securityreport)
