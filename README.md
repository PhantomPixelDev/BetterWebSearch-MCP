# BetterWebSearch MCP

> Keyless-first web search for AI agents. DuckDuckGo works out of the box. No API keys.

[![npm version](https://img.shields.io/npm/v/better-web-search-mcp?color=cb3837)](https://www.npmjs.com/package/better-web-search-mcp)
[![CI](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/actions/workflows/ci.yml/badge.svg)](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/actions)
[![Docs](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://phantompixeldev.github.io/BetterWebSearch-MCP/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Smithery](https://smithery.ai/badge/@PhantomPixelDev/better-web-search-mcp)](https://smithery.ai/server/@PhantomPixelDev/better-web-search-mcp)

<p align="center">
  <img src="./images/banner.jpg" alt="BetterWebSearch MCP — Smarter Web Search · Better Data Extraction · Flexible & Extensible · Open Source" width="100%">
</p>

## What is this?

BetterWebSearch MCP is a [Model Context Protocol](https://modelcontextprotocol.io) server that gives AI assistants genuinely better web research. It works without API keys by default (DuckDuckGo), and optionally adds Brave or Tavily for richer ranking and recency.

Built for anyone who wants their AI tools to find things on the web reliably, not just when a paid API key is configured.

## Quick start (30 seconds)

Add this to your MCP client config (Claude Desktop, Cursor, VS Code Copilot, OpenCode, or any MCP client):

```json
{
  "mcpServers": {
    "better-web-search-mcp": {
      "command": "npx",
      "args": ["-y", "better-web-search-mcp"]
    }
  }
}
```

That's it. Every search tool works immediately. No `.env`, no API keys, no setup.

Or run it directly:

```bash
npx -y better-web-search-mcp --help
```

## Tools

| Tool | What it does |
|---|---|
| `web_search` | Aggregated search across providers, deduplicated and reranked |
| `web_research` | Deep research. Rewrites your question, searches in parallel, extracts top results with citations |
| `deep_search` | Alias for `web_research` |
| `web_extract` | Extracts clean content from any URL, using the best method available |
| `web_find` | Search scoped to a single website |
| `web_news` | Recent news with timeline and diversity filtering |

## How search is better

Standard MCP search tools hit one API and return raw results. BetterWebSearch takes a different approach.

**Query expansion.** Your single question gets rewritten into 4 to 6 variants, searched in parallel. "Unlimited mobile internet Germany" also searches for "unbegrenztes Datenvolumen Deutschland" and similar phrasings. More coverage without you doing extra work.

**Three-tier extraction.** When it fetches a page, it doesn't just grab the HTML and hope for the best:

```
Tier 1: Fast HTTP fetch          (< 1s)
    ↓ if not enough content
Tier 2: Structured data          (JSON-LD, __NEXT_DATA__, __NUXT__)  (1-3s)
    ↓ if still not enough
Tier 3: Playwright browser       (full render + API interception)    (3-10s)
```

Only escalates when needed. Results carry confidence scores so you know what you're getting.

**Self-learning cache.** The first visit to a domain takes the full path. The second visit skips straight to what worked. Domain profiles and API patterns are remembered.

## Token efficiency

Doing the web work inside the server, rather than handing pages to the model,
is the point. The repository ships the benchmark that checks it.

Same questions, same pages, two workflows:

- **baseline** — the agent drives the tools: one `web_search`, then
  `web_extract` on each of the top 5 results. Every page lands in its context.
- **research** — one `web_research` call, returning cited passages.

12 questions across definition, technical, comparison, troubleshooting and
research categories, run 2026-09-02 against the live web with the browser tier
disabled:

| | Baseline | `web_research` |
|---|---|---|
| Payload | 820,229 chars | **110,973 chars** |
| Tokens (est. at 4 chars) | ~205,000 | **~28,000** |
| Wall clock | 137.3s | **49.6s** |

**86.5% less text overall, 83.8% median**, per-question range 56.8% to 93.4%.

Re-running with the browser tier enabled gives 86.2% overall and 83.9% median —
the same within run-to-run noise — while taking 24% longer (61.3s vs 49.6s).
Tier 3 earns its place on JavaScript-rendered pages that would otherwise
extract nothing, not as a way to return less text.

Reproduce it yourself:

```bash
npm run build && npm run bench
```

Honest caveats, because these are the ones that matter:

- Payload is counted in **characters** — exact and tokenizer-independent. The
  token column is an estimate at 4 chars/token for orientation; the *ratio* is
  the real result and barely moves between tokenizers.
- **This measures payload, not answer quality.** Deciding whether the retained
  passages still support a correct answer needs a judge model, which this
  harness does not have. A smaller payload is only a win if the right text
  survived; `query_term_coverage` is reported per question as a weak proxy and
  is deliberately not folded into the headline number.
- Reduction tracks how much page text there was. The 56.8% case had a small
  baseline (~20k chars), where the fixed cost of the response's source list
  dominates.
- Live-web runs are not bit-reproducible: pages change and DuckDuckGo
  rate-limits scrapers.
- No comparison against Exa, Tavily's answer endpoint, or hosted web search —
  they cannot be run under identical conditions on the same pages.

### Does compression keep the answer?

Reduction only counts if the answer survives it. `npm run bench:quality` checks
that on 34 questions with an unambiguous marker (a port number, a status code, a
license name), conditioned on the baseline so retrieval misses are never counted
as compression losses:

| Category | Retained | Retention |
|---|---|---|
| Numbers (ports, limits) | 8 / 8 | 100% |
| HTTP status codes | 6 / 6 | 100% |
| Acronym expansions | 12 / 12 | 100% |
| Facts (licenses, defaults) | 7 / 8 | 87.5% |
| **Overall** | **33 / 34** | **97.1%** |

Acronym questions used to retain only 58.3%: the sentence spelling out
"transport layer security" states it once while surrounding pages repeat the
acronym, so BM25 ranked the answer below the noise. Passage selection now
recognises acronym-definition questions and surfaces the expansion. Verified by
replaying one frozen page corpus so the only variable is the code — acronyms
went 6/12 to 12/12, overall 27/34 to 33/34 — and confirmed by a live run at the
same figures.

The remaining loss is not an acronym question: *"Which HTTP request header is
used to make a conditional request with an ETag?"*, where the answer
(`If-None-Match`) appears in reference tables that the passage splitter does
not keep intact.

Method and raw per-question results: [`benchmarks/`](benchmarks/).

## Security

Page content is attacker-controlled and URLs arrive from the calling agent, so
both are treated as untrusted.

- **SSRF guard.** Non-HTTP schemes are refused; hostnames are resolved and
  private, loopback, link-local, CGNAT, multicast and reserved addresses
  rejected — including IPv4-mapped IPv6 forms like `::ffff:127.0.0.1`.
  Redirects are followed manually so *every hop* is re-checked, capped at 5.
- **Prompt-injection screening.** Every `web_extract` result carries a
  `security` block marking content untrusted and flagging text that tries to
  issue instructions to an agent, with the matched pattern and its offset.
  Content is never rewritten, so extraction stays faithful to the source.
- **Source independence.** Pages are clustered by content before citing, so a
  wire story republished by five outlets counts as one account rather than five
  corroborating sources.

See [SECURITY.md](.github/SECURITY.md) for the full threat model.

## Project structure

```
src/
  providers/      Search backends (DuckDuckGo, Brave, Tavily; SerpApi stubbed)
  extraction/     3-tier content pipeline (fetch, structured, browser)
  ranking/        Deduplication, domain scoring, reranking, passage selection,
                  source-independence clustering
  tools/          MCP tool definitions (search, research, extract, find, news)
  utils/          Config, caching, retry, query rewriting, SSRF guard
benchmarks/       Token-efficiency harness and results
```

## Configuration

All configuration is optional. DuckDuckGo works with zero setup.

```bash
# Optional: add more providers
BRAVE_API_KEY=your_key     # Better ranking and recency
TAVILY_API_KEY=your_key    # Alternative provider
```

See the [full configuration reference](https://phantompixeldev.github.io/BetterWebSearch-MCP/docs/configuration/) for all options including cache paths, browser settings, and environment variable names.

## Documentation

Full guides, API reference, and architecture details live on the docs site:

**[phantompixeldev.github.io/BetterWebSearch-MCP](https://phantompixeldev.github.io/BetterWebSearch-MCP/)**

- [Installation](https://phantompixeldev.github.io/BetterWebSearch-MCP/docs/installation/) - npx, npm, or from source
- [Quick Start](https://phantompixeldev.github.io/BetterWebSearch-MCP/docs/quickstart/) - Get running in your first AI client
- [Configuration](https://phantompixeldev.github.io/BetterWebSearch-MCP/docs/configuration/) - All environment variables and options
- [Contributing](https://phantompixeldev.github.io/BetterWebSearch-MCP/docs/contributing/) - Development setup and PR process
- [Changelog](CHANGELOG.md) - Release history and version notes

## License

MIT
