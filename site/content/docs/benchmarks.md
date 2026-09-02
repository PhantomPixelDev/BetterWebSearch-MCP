---
title: "Token Efficiency"
description: "Measured comparison of what an agent ingests when it drives the tools itself versus one web_research call."
weight: 45
---

The point of doing web work inside the server is that the model never has to
read the pages. This page reports what that is actually worth, measured rather
than asserted. The harness ships in the repository under `benchmarks/`.

## Method

Two workflows, the same questions, the same pages:

| Path | What lands in the agent's context |
|---|---|
| **baseline** | The agent drives the tools: one `web_search`, then `web_extract` on each of the top 5 results. Every extracted page enters context in full. |
| **research** | One `web_research` call. The response is the cited passages plus their metadata. |

Both paths open the same URLs, so this isolates the compression the pipeline
performs from any difference in what was retrieved.

Payload is counted in **characters** — exact and tokenizer-independent. Token
figures are an estimate at 4 characters per token, for orientation only. The
reduction ratio is the result that matters, and it barely moves between
tokenizers.

## Results

12 questions spanning definition, technical, comparison, troubleshooting and
research categories. Run 2026-09-02 against the live web with
`BETTER_WEB_SEARCH_DISABLE_BROWSER=true`.

| | Baseline | `web_research` |
|---|---|---|
| Payload | 820,229 chars | **110,973 chars** |
| Tokens (est.) | ~205,000 | **~28,000** |
| Wall clock | 137.3s | **49.6s** |

**86.5% less text overall, 83.8% median.**

Per question:

| Question | Baseline | Research | Reduction | Independent sources |
|---|---|---|---|---|
| What is the Model Context Protocol? | 101,958 | 12,765 | 87.5% | 4/5 |
| What does Mozilla Readability do? | 48,385 | 8,186 | 83.1% | 4/5 |
| How does Playwright wait for network idle? | 19,946 | 8,610 | 56.8% | 4/5 |
| SQLite WAL mode tradeoffs | 54,591 | 8,738 | 84.0% | 5/5 |
| BM25 term frequency saturation | 160,596 | 10,808 | 93.3% | 5/5 |
| PostgreSQL vs MySQL for JSON | 43,894 | 7,371 | 83.2% | 4/4 |
| Vitest compared to Jest | 45,925 | 7,543 | 83.6% | 5/5 |
| Preventing SSRF on user URLs | 46,921 | 8,464 | 82.0% | 5/5 |
| npm provenance from GitHub Actions | 57,736 | 8,117 | 85.9% | 5/5 |
| Prompt-injection defenses for browsing agents | 74,365 | 10,869 | 85.4% | 4/5 |
| RAG chunking strategies | 54,930 | 12,232 | 77.7% | 7/10 |
| Technical SEO for static docs sites | 110,982 | 7,270 | 93.4% | 5/5 |

The `4/5` and `7/10` columns are the syndication check working on live pages:
those runs opened five or ten URLs but found fewer genuinely separate accounts.

## What this does not measure

- **Answer quality.** Judging whether the retained passages still support a
  correct answer requires a judge model, which this harness does not have. A
  smaller payload is only a win if the right text survived. Per-question
  `query_term_coverage` is recorded as a weak proxy and is deliberately not
  folded into the headline figure.
- **End-to-end agent cost.** A real agent may issue follow-up searches; this is
  one question, one pass.
- **Other tools.** No comparison against Exa, Tavily's answer endpoint or
  hosted web search, because they cannot be run under identical conditions
  against the same pages.

Reduction also tracks how much page text existed in the first place. The 56.8%
case had a roughly 20k-character baseline, where the fixed cost of the
response's source list dominates.

## Reproducing

```bash
npm run build
npm run bench                    # all questions
npm run bench -- --questions 3   # a quick subset
```

Results are written to `benchmarks/results/latest.json` after every question,
so an interrupted run still leaves usable data. Runs hit the live web and are
not bit-reproducible: pages change, and DuckDuckGo rate-limits scrapers. Set
`BRAVE_API_KEY` or `TAVILY_API_KEY` for steadier results.
