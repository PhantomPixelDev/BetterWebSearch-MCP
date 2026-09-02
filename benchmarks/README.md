# Token-efficiency benchmark

Measures how much text an agent actually ingests to answer the same question
two ways, against the same pages.

```bash
npm run build
npm run bench                 # all questions
npm run bench -- --questions 3
```

Results are written to `benchmarks/results/latest.json` after every question,
so an interrupted run still leaves usable data.

## What is compared

| Path | What lands in the agent's context |
|---|---|
| **baseline** | The agent drives the tools itself: one `web_search`, then `web_extract` on each of the top 5 results. Every extracted page enters context in full. |
| **research** | One `web_research` call. The response is the cited passages plus their metadata. |

Both paths open the same URLs, so this measures the compression the pipeline
performs — not a difference in what was retrieved.

## What is measured

Payload is counted in **characters**, which is exact and tokenizer-independent.
A token estimate at 4 characters per token is reported for orientation only.
The reduction ratio is the number that matters, and it barely moves between
tokenizers.

Per question the report records `baseline_chars`, `research_chars`,
`reduction`, wall-clock time for each path, and the evidence counters
(`sources_opened`, `independent_sources`, `cited_spans`,
`query_term_coverage`).

## What this does *not* measure

- **Answer quality.** Comparing whether the compressed evidence still supports
  a correct answer needs a judge model. This harness has none, so it makes no
  claim about accuracy — only about payload size.
- **End-to-end agent cost.** A real agent may issue follow-up searches. This
  measures one question, one pass.
- **Anything about other tools.** There is no comparison against Exa, Tavily's
  own answer endpoint, or a hosted web search here, because they cannot be run
  under identical conditions on the same pages.

A smaller payload is only a win if the retained passages still answer the
question. `query_term_coverage` is a weak proxy for that and is reported
alongside, not folded into the headline number.

## Reproducibility

Runs hit the live web, so they are not bit-reproducible: pages change, and
DuckDuckGo rate-limits scrapers. Failures are reported per question rather than
aborting the run. Set `BRAVE_API_KEY` or `TAVILY_API_KEY` for steadier results.

`BETTER_WEB_SEARCH_DISABLE_BROWSER=true` keeps a run to the HTTP and structured
tiers, which is much faster; the browser tier can spend up to 35s on a single
page. Published numbers state which mode was used.
