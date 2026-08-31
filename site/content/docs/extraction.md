---
title: "Extraction"
description: "The 3-tier page extraction pipeline: HTTP fetch, structured hydration data, and Playwright browser with content fusion."
weight: 35
---

# Extraction Pipeline

BetterWebSearch MCP extracts page content through a **three-tier escalation pipeline** managed by the `AccessRouter`. Each tier is progressively more powerful (and slower); the router only escalates when the current tier doesn't produce enough content.

## Overview

```
URL → Level 1: HTTP fetch (< 1s)
    → Level 2: Hydration / structured data (1–3s)
    → Level 3: Playwright browser + API interception (3–10s)
```

Only escalates when needed. A page-cache hit short-circuits the entire pipeline.

## Tier 1: HTTP Fetch

- **Speed:** < 1 second
- **Method:** Standard `fetch` with user-agent spoofing, 10s timeout, 2MB cap
- **Confidence:** 0.85

Fetches the raw HTML and runs [Mozilla Readability](https://github.com/mozilla/readability) to extract clean markdown. Wins when the page has enough visible text (> 500 characters after stripping tags).

## Tier 2: Structured / Hydration Data

- **Speed:** 1–3 seconds
- **Method:** Parses embedded JSON data from the HTML source
- **Confidence:** 0.90 (0.95 for Product schema)

Extracts structured content from:
- **JSON-LD** — Schema.org structured data (`articleBody`, `description`, `headline`, `name`)
- **`__NEXT_DATA__`** — Next.js hydration payload
- **`self.__next_f`** — Next.js streaming RSC data
- **`__NUXT__`** — Nuxt.js hydration payload
- **`__APOLLO_STATE__`** — Apollo GraphQL cache

Wins when the extracted structured content exceeds 200 characters.

## Tier 3: Playwright Browser

- **Speed:** 3–10 seconds
- **Method:** Headless Chromium via Playwright pool (3 instances)
- **Confidence:** 0.96 (API intercept) / 0.90 (rendered DOM)

Features:
- **Image/font/media blocking** for speed
- **Intelligent race** between `networkidle`, `article` detection, and `innerText > 1000`
- **`page.on('response')` interception** — captures JSON API responses made by the page
- **Bounded concurrency** — max 3 simultaneous browser renders
- **8-second timeout** per URL

## Content Fusion

When multiple extraction strategies produce content, the **fusion layer** picks the winner based on confidence scores:

| Method | Confidence | Description |
|---|---|---|
| `api` | 0.99 | Captured API endpoint responses |
| `jsonld` | 0.95 | JSON-LD / hydration structured data |
| `rendered` | 0.90 | Playwright-rendered DOM |
| `readability` | 0.85 | HTTP fetch + Readability extraction |
| `metadata` | 0.60 | Page metadata fallback |

The strategy with the highest effective confidence and non-empty content becomes the primary body. Structured data and API endpoints from **every** strategy are merged regardless of which strategy won.

## Extraction modes

The `web_extract` tool supports three modes:

| Mode | Behavior |
|---|---|
| `auto` | Escalates through tiers as needed (default) |
| `fast` | Skips the browser (Tier 1 + Tier 2 only) |
| `browser` | Forces browser render (skips to Tier 3) |

## Response shape

Every extraction returns:

```json
{
  "url": "https://example.com/page",
  "title": "Page Title",
  "content": "Extracted markdown...",
  "extraction": {
    "method": "http_fetch | hydration_data | browser_api_intercept | rendered_dom",
    "confidence": 0.85,
    "rendered": false
  },
  "structured_data": { "jsonLd": [...], "nextData": {...} },
  "api_endpoints": [...],
  "metadata": {
    "title": "...",
    "description": "...",
    "published": "...",
    "author": "...",
    "siteName": "..."
  }
}
```

## Self-learning cache

After each successful extraction:
- **Domain profiles** are updated — recording which extraction method worked best for each domain
- **API patterns** are recorded — so the next visit to the same domain can skip the browser and go straight to the cached API endpoint

Both are persisted in `data/cache.db` (SQLite WAL mode), so the second visit to any domain is typically faster.

## Alternative source discovery

When the primary extraction is blocked (HTTP 401/403/429) or produces low confidence (< 0.5), the system searches for alternative sources:
- **AMP variants** (`?output=1`, `/amp`)
- **Quoted-title `site:` searches** on other domains
- **Snippet evidence** with confidence 0.6

## Best-effort fallback

If all three tiers fail, a best-effort fallback returns whatever content was available with confidence 0.5.
