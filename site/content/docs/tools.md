---
title: "Tools Reference"
description: "Complete reference for all 6 MCP tools: web_search, web_research, web_extract, web_find, web_news, and deep_search."
weight: 20
---

BetterWebSearch MCP exposes **6 tools** (5 unique + 1 alias). All are keyless-first — DuckDuckGo provides search without any API keys.

## Overview

| Tool | What it does | Keyless? |
|---|---|---|
| `web_search` | Fast search (aggregated, deduped, reranked) | ✓ |
| `web_research` / `deep_search` | Deep research: rewrites question → parallel searches → top-10 extraction → citations | ✓ |
| `web_extract` | Clean extraction `HTTP → hydration → browser` with `confidence` & `api_endpoints` | ✓ |
| `web_find` | `site:` scoped search | ✓ |
| `web_news` | Recent news + timeline + diversity | ✓ |

---

## `web_search`

Fast multi-provider search. Aggregates results from all enabled providers, deduplicates, re-ranks by relevance, and returns the top matches.

**Input parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `query` | `string` | ✓ | — | Search query (must not be empty) |
| `max_results` | `int` | no | `10` | Max results (1–20) |
| `recency_days` | `int` | no | — | Restrict to results within N days (0–365) |

**Response shape:**

```json
{
  "answer": "Top N results for \"query\"",
  "sources": [
    {
      "title": "Page Title",
      "url": "https://example.com/page",
      "snippet": "Short description...",
      "published": "2026-08-29T10:00:00Z",
      "relevance": 0.85
    }
  ],
  "queries_used": ["query"]
}
```

---

## `web_research` (alias: `deep_search`)

Deep research orchestrator. Rewrites a question into multiple search variants, runs them in parallel across providers, merges/deduplicates/ranks, opens the top pages through the extraction pipeline (bounded concurrency 3, 8s per page timeout), and returns the passages that actually address the question, each with a citation anchor. No LLM is involved — passages are selected with BM25 against the question, so the calling agent receives evidence rather than page intros.

**Input parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `question` | `string` | ✓ | — | Research question (must not be empty) |
| `depth` | `"quick" \| "deep"` | no | `"deep"` | `quick` uses 2 query variants; `deep` uses all 4–6 |
| `recency_days` | `int` | no | — | Restrict results to within N days (0–365) |
| `count_per_query` | `int` | no | `5` | Results per expanded query (1–10) |

**Response shape:**

```json
{
  "answer": "Based on N sources:\n\n[1] excerpt...\n[2] excerpt...",
  "sources": [...],
  "queries_used": ["original question", "variant 2", "..."],
  "extraction_stats": {
    "method_counts": { "http_fetch": 5, "hydration_data": 3 },
    "avgConfidence": 0.91
  }
}
```

**Key behaviors:**
- Query expansion: `unlimited mobile internet Germany` → 4–6 variants incl. `unbegrenztes Datenvolumen ... Deutschland`
- Bounded concurrency: 3 pages opened simultaneously
- Per-page timeout: 8 seconds
- Max pages extracted: 10
- Max cited passages in answer: 5 (at most 2 considered per page, best-first across distinct sources)

---

## `web_extract`

Extracts readable content from one or more URLs using the three-tier escalation pipeline (HTTP fetch → structured hydration → Playwright browser). Returns per-URL content with extraction method, confidence score, structured data, and API endpoints.

**Input parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `urls` | `string[]` | ✓ | — | URLs to extract (each must be valid URL) |
| `mode` | `"auto" \| "fast" \| "browser"` | no | `"auto"` | `auto` escalates, `fast` skips browser, `browser` forces it |
| `include_api_data` | `boolean` | no | `true` | Include API data captured during browser render |
| `include_structured_data` | `boolean` | no | `true` | Include JSON-LD / hydration data |
| `browser_fallback` | `boolean` | no | `true` | Fall back to browser when HTTP is insufficient |

**Response shape (per URL):**

```json
{
  "url": "https://example.com/page",
  "title": "Page Title",
  "content": "Extracted markdown content...",
  "extraction": {
    "method": "http_fetch",
    "confidence": 0.85,
    "rendered": false
  },
  "structured_data": {...},
  "api_endpoints": {...},
  "metadata": {
    "title": "...",
    "description": "...",
    "published": "...",
    "author": "...",
    "siteName": "..."
  }
}
```

---

## `web_find`

Site-restricted search. Builds a `site:<domain> <query>` query and returns the top matching pages.

**Input parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `query` | `string` | ✓ | — | Search query (must not be empty) |
| `site` | `string` | ✓ | — | Domain to restrict search to (e.g. `example.com`) |
| `max_results` | `int` | no | `10` | Max results (1–20) |

**Response shape:**

```json
{
  "answer": "Top N results from example.com for \"query\"",
  "sources": [...],
  "queries_used": ["site:example.com query"]
}
```

---

## `web_news`

Recency-filtered news search with timeline grouping and domain diversity enforcement.

**Input parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `topic` | `string` | ✓ | — | News topic (must not be empty) |
| `recency_days` | `int` | no | `7` | Restrict to results within N days (1–365) |
| `max_results` | `int` | no | `10` | Max results (1–20) |

**Response shape:**

```json
{
  "answer": "Top N recent news results for \"topic\" within 7 days",
  "sources": [...],
  "timeline": {
    "2026-08-29": [...],
    "2026-08-28": [...]
  },
  "queries_used": ["topic"]
}
```

**Key behaviors:**
- Filters results strictly by publication date within the recency window
- Enforces domain diversity: at most one result per host
- Groups results into a timeline keyed by publication date (YYYY-MM-DD)
- Uses `3× max_results` from providers before filtering for diversity

---

## Shared response structure

All search tools return `SearchSource` entries:

```json
{
  "title": "Page Title",
  "url": "https://example.com/page",
  "snippet": "Short text description",
  "published": "2026-08-29T10:00:00Z",
  "relevance": 0.85
}
```

Relevance scores range from 0 to 1, computed by the reranker using: `0.5 × text_overlap + 0.2 × domain_score + 0.2 × recency + 0.1 × provider_score`.
