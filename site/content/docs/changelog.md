---
title: "Changelog"
description: "Release history for BetterWebSearch MCP following Keep a Changelog format."
weight: 90
---

All notable changes to **better-web-search-mcp** are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] - 2026-09-02

### Added
- **Evidence-retention benchmark** (`npm run bench:quality`). Payload reduction
  only counts if the answer survives it, and measuring that normally needs a
  judge model. This one avoids a judge by using questions with an unambiguous
  marker and conditioning on the baseline, so a retrieval miss is never counted
  as a compression loss. Measured retention is **11 of 12, 91.7%**, at 92.5%
  payload reduction on that set. The single loss is published rather than
  hidden: "What does WAL stand for in SQLite journal_mode?" keeps the query
  terms while the sentence spelling out "write-ahead logging" often does not,
  so BM25 ranks other passages above it. Acronym-expansion questions are a
  known weak spot of lexical passage selection
- **Information density scoring** (`src/ranking/density.ts`). Listicles and
  link farms are scored down using structural signals only — link-to-text
  ratio, repeated paragraphs, boilerplate line share, sentence length — so the
  measure stays deterministic. Citation candidates are weighted by their page's
  density, and `evidence.low_density_sources` reports how many thin pages were
  opened

### Changed
- Density weighting is a multiplier in [0.5, 1] rather than a filter. A
  listicle can still carry the one sentence that answers a question, so a thin
  page competes at a disadvantage instead of being discarded

## [0.4.4] - 2026-09-02

### Added
- Second benchmark run with the browser tier enabled, recorded in
  `benchmarks/results/browser.json`. It is a negative result and is published
  as one: enabling Tier 3 leaves the compression unchanged within run-to-run
  noise (86.2% versus 86.5% overall, 83.9% versus 83.8% median) while research
  spends 24% longer. Tier 3 earns its place on JavaScript-rendered pages that
  would otherwise extract nothing, not as a way to return less text

## [0.4.3] - 2026-09-02

### Fixed
- **The intermittent CI abort is finally addressed at the right layer.**
  Earlier attempts blamed the wrong thing: switching to forked processes, then
  serializing them, then closing handles at process exit each lowered the rate
  without removing it. The mechanism is that vitest tears down the
  better-sqlite3 addon's N-API environment between test *files*, so every file
  boundary after the addon has loaded is a chance to hit
  `Assertion failed: (env) != nullptr`. `npm test` now runs the one suite that
  opens a real database in its own vitest invocation, where that environment
  is destroyed at process exit instead of at a file boundary

## [0.4.2] - 2026-09-02

### Fixed
- **SQLite handles are closed on process exit.** A `Database` left open at exit
  is finalized during teardown, and when that happened after the N-API
  environment was gone the addon aborted the process with
  `Assertion failed: (env) != nullptr`. It showed up as intermittent CI
  failures that neither forked nor serialized test runs fully removed, but the
  same race can strand a WAL file in a real deployment. Open databases are now
  tracked and closed synchronously on exit, with the hook installed once rather
  than per database

## [0.4.1] - 2026-09-02

### Fixed
- **A cited passage could be an entire page.** `splitPassages` emitted an
  over-long block whole, and plenty of extracted pages contain no blank lines
  at all, so the whole document became a single passage. `web_research` then
  returned *more* text than reading the pages directly would have — the first
  benchmark run measured a 267% increase against the baseline it was supposed
  to beat. Blocks longer than 1,200 characters are now windowed on sentence
  boundaries, without cutting words and with offsets still addressing the
  source

### Added
- **Token-efficiency benchmark** under `benchmarks/`, run with `npm run bench`.
  It compares an agent driving the tools itself against a single
  `web_research` call over the same pages, and is what caught the bug above.
  Measured over 12 questions: 820,229 characters down to 110,973, an 86.5%
  reduction overall and 83.8% median. Payload is counted in characters, which
  is exact and tokenizer-independent; the harness makes no claim about answer
  quality, which would need a judge model

## [0.4.0] - 2026-09-02

### Added
- **Source independence detection.** URL deduplication only ever caught the
  same page twice; syndication went straight through. Five outlets running one
  wire story, a vendor press release quoted verbatim, or an article and its own
  AMP variant all arrived as distinct URLs and were reported as five sources.
  Pages are now clustered by content shingles (Jaccard over 5-word shingles,
  union-find so clustering is transitive), and two pages from the same host are
  treated as one account
- **`evidence` block on `web_research` responses**, reporting only things the
  server actually measured: `sources_opened`, `independent_sources`,
  `derivative_sources`, `query_term_coverage`, and `cited_spans`. There is no
  language model in this server, so there is no confidence score — an invented
  one would be worse than none

### Changed
- Citations spread across independent accounts rather than distinct URLs, and
  derivative sources no longer contribute quotes at all. Previously the pass
  that topped up remaining citation slots could refill them with the same story
  under a second byline, presenting one claim as corroborated

## [0.3.0] - 2026-09-02

### Security
- **SSRF protection.** `web_extract` took URLs straight from the calling agent
  and `fetchPage` followed them with no validation, so `http://localhost:8080/`,
  `http://192.168.1.1/`, and the cloud metadata endpoint at
  `http://169.254.169.254/` were all fetchable and came back as ordinary page
  content. Every URL is now checked before the request: non-HTTP schemes are
  refused, hostnames are resolved, and any private, loopback, link-local,
  carrier-grade-NAT, multicast or reserved address is rejected. IPv4-mapped
  IPv6 forms such as `::ffff:127.0.0.1` are judged by their IPv4 rules
- **Redirects are validated per hop.** Fetching now uses manual redirects and
  re-runs the guard on each `Location`, so a public host cannot bounce the
  fetcher onto a private one. Chains are capped at 5 hops
- **Prompt-injection screening.** Page text is attacker-controlled, so every
  `web_extract` result now carries a `security` block marking content untrusted
  and reporting text that tries to address an agent, with the matched pattern
  and its offset. Suspicious content gets a warning banner; the page text
  itself is never rewritten, so extraction stays faithful to the source

### Changed
- **`web_research` selects passages that answer the question.** It previously
  took the first 400 characters of each of the top 5 pages and never looked at
  the question, so answers were largely cookie notices and page intros.
  Passages are now scored against the question with BM25, and the best ones
  are returned best-first across distinct sources. This also cuts tokens,
  since only matching paragraphs are included

### Added
- `web_research` responses include `citations`: each cited span carries its
  source, the verbatim quote, character offsets into that page's extracted
  content, and a relevance score, so a claim can be attributed to a span
  rather than to a whole page
- `fetchPage` accepts `allowPrivateHosts` for local fixture servers and `ssrf`
  for injecting DNS resolution in tests

## [0.2.3] - 2026-09-02

### Fixed
- `BETTER_WEB_SEARCH_DISABLE_CACHE` and `BETTER_WEB_SEARCH_CACHE_PATH` are
  finally honored. Both were parsed by the config loader, printed in the
  startup banner, and documented in `--help`, but nothing passed them to the
  cache — the server opened `data/cache.db` regardless of what either said

### Changed
- Test files now run serially in a single forked process. Forks alone were not
  enough: parallel files still raced the better-sqlite3 addon's own teardown,
  tripping `Assertion failed: (env) != nullptr` inside the native module
- Security policy now tracks the 0.2.x line and describes the cache
  mitigations accurately
- The v0.1.0 launch checklist is marked historical rather than reading as a
  current process

## [0.2.2] - 2026-09-02

### Fixed
- A locked, corrupt, or unwritable `data/cache.db` no longer takes the server
  down at boot. Opening SQLite is guarded and falls back to the in-memory
  cache with a warning on stderr; directory creation is inside the guard too,
  so a read-only or permission-denied cache path degrades instead of throwing
- The startup banner no longer advertises SerpApi, which has not been part of
  the provider set since 0.2.0

### Added
- `mcp.json` now tracks the package version automatically via the `version`
  lifecycle hook, with a test asserting the two stay in step — the manifest
  had silently read 0.1.0 while npm was publishing 0.2.1

### Changed
- `release:*` scripts no longer run `npm publish` locally. Publishing is the
  tag-triggered workflow's job; doing both meant the local publish won and CI
  then failed with `E403 cannot publish over the previously published
  versions`, which is how 0.2.1 shipped without provenance and without a
  GitHub release

## [0.2.1] - 2026-09-02

### Changed
- Test runner uses forked processes, reducing intermittent
  `Worker exited unexpectedly` CI failures caused by loading the
  better-sqlite3 native addon inside a worker thread (see 0.2.3 for the
  follow-up that closed the remaining window)
- Compiled tests are excluded from the published package: 252 files down to
  148, 126.4 kB down to 85.1 kB

## [0.2.0] - 2026-09-01

### Fixed
- **The Level 3 browser tier never ran in production.** No call site passed a
  `browserPool` to `getPage`, so the escalation guard skipped it entirely and
  `BrowserPool` was constructed only in tests. The router now creates a shared
  pool lazily on first escalation, so JS-rendered pages actually get rendered
- `web_extract`'s flat 8s per-URL budget was shorter than a browser render's
  23s worst case (15s navigation + 4s intelligent wait + 4s DOM stability), so
  every Level 3 extraction was killed before it could return. The budget is now
  sized to the tiers that can run: 8s without the browser, 35s with it
- `BETTER_WEB_SEARCH_DISABLE_BROWSER` was documented but never read; it now
  actually disables the browser tier
- Aborted requests are no longer retried. Providers share one `AbortController`
  across attempts, so a retry after the timeout fired could only fail again
  instantly, burning the retry budget
- Brave and Tavily now set `retryNetworkErrors`, matching DuckDuckGo

### Added
- Domain-profile shortcut: the per-domain profile written after every
  extraction is finally read back, so a domain already served without
  JavaScript skips the render. `mode: "browser"` still overrides it
- Per-provider 10s timeout inside `aggregateSearch` — one hung provider no
  longer gates the other providers' results
- Clean shutdown on `SIGINT`/`SIGTERM` so a lazily launched chromium is not
  orphaned
- 16 tests (229 total), including a browser-tier suite covering pool reuse,
  the disable flag, and the profile shortcut

### Removed
- The unimplemented SerpApi stub is no longer added to `enabledProviders()`;
  it was a guaranteed no-op call on every search. The class remains as a
  placeholder

### Notes
- `web_extract` on JavaScript-heavy pages is slower than 0.1.2 (up to 35s) but
  now returns real content instead of a confidence-0 fallback

## [0.1.2] - 2026-08-31

### Added
- Project banner in the README and on the site homepage
- Hugo docs site on the hugo-book theme with native sidebar navigation

### Changed
- Node baseline bumped to 22 LTS
- Root directory cleanup and a rewritten end-user README

### Fixed
- Release workflow npm authentication
- Sidebar navigation, duplicate H1 headings, and mobile menu on the docs site

## [0.1.1] - 2026-08-29

### Fixed
- Packaging and release-workflow fixes on top of the initial release

## [0.1.0] - 2026-08-29

### Added
- Initial public release — keyless-first MCP server for web research
- Multi-provider search abstraction: Brave (primary), Tavily (optional), DuckDuckGo (keyless fallback), SerpApi stub — aggregated via `Promise.allSettled`, deduplicated and reranked
- Query expansion: 4–6 parallel variants incl. German translations (e.g. `unlimited mobile internet Germany` → `unbegrenztes Datenvolumen`)
- Ranking pipeline: `normalizeUrl` (utm/gclid/fbclid strip, trailing slash, hash), `domainScore` curated tiers, `rerank` (0.5 overlap +0.2 domain +0.2 recency +0.1 score)
- 3-tier extraction: Level 1 `fetchPage` (10s, 2MB cap, UA) → Level 2 `JSON-LD / __NEXT_DATA__ / self.__next_f / __NUXT__ / __APOLLO_STATE__` → Level 3 Playwright pool (3, image/font/media block, intelligent Race `networkidle`/`article`/`innerText>1000`, `page.on('response')` JSON capture)
- Content Fusion with confidence scores (`api 0.99` > `jsonld 0.95` > `rendered 0.90` > `readability 0.85`)
- Alternative source discovery: AMP variants `?output=1 /amp` + quoted-title `site:` searches, snippet evidence `search_snippet 0.6`
- SQLite cache (`better-sqlite3` WAL, `data/cache.db`) + in-memory fallback — `search_cache` 15min, `page_cache` 1h, `api_patterns`, `domain_profiles` — `domainProfile` self-learning per domain
- 6 MCP tools: `web_search`, `web_research`/`deep_search` (parallel queries, bounded concurrency 3, 8s per page, extractive citations), `web_extract` (auto/fast/browser), `web_find`, `web_news` (recency + timeline + diversity)
- Central `config` loader: `BRAVE_API_KEY` + `BETTER_WEB_SEARCH_BRAVE_API_KEY` aliases, cache/browser toggles, keyless hint banner to stderr
- CLI: `--help` / `--version` (exit before MCP handshake), startup banner listing providers
- OpenCode / Claude / Cursor / VS Code configs: `mcp.json`, `.vscode/mcp.json`, `smithery.yaml`
- 195 tests (vitest), `tsc` strict, `npm run build` emits `dist/`

### Notes
- No API keys required for first test — `npx better-web-search-mcp` works via DuckDuckGo
- Add `BRAVE_API_KEY` for richer ranking & recency filtering
- Publish-ready: `npm pack --dry-run` validated, `prepare`/`prepublishOnly` hooks, `files` whitelist

[0.5.0]: https://github.com/PhantomPixelDev/BetterWebSearch-MCP/releases/tag/v0.5.0
[0.4.4]: https://github.com/PhantomPixelDev/BetterWebSearch-MCP/releases/tag/v0.4.4
[0.4.3]: https://github.com/PhantomPixelDev/BetterWebSearch-MCP/releases/tag/v0.4.3
[0.4.2]: https://github.com/PhantomPixelDev/BetterWebSearch-MCP/releases/tag/v0.4.2
[0.4.1]: https://github.com/PhantomPixelDev/BetterWebSearch-MCP/releases/tag/v0.4.1
[0.4.0]: https://github.com/PhantomPixelDev/BetterWebSearch-MCP/releases/tag/v0.4.0
[0.3.0]: https://github.com/PhantomPixelDev/BetterWebSearch-MCP/releases/tag/v0.3.0
[0.2.3]: https://github.com/PhantomPixelDev/BetterWebSearch-MCP/releases/tag/v0.2.3
[0.2.2]: https://github.com/PhantomPixelDev/BetterWebSearch-MCP/releases/tag/v0.2.2
[0.2.1]: https://github.com/PhantomPixelDev/BetterWebSearch-MCP/releases/tag/v0.2.1
[0.2.0]: https://github.com/PhantomPixelDev/BetterWebSearch-MCP/releases/tag/v0.2.0
[0.1.2]: https://github.com/PhantomPixelDev/BetterWebSearch-MCP/releases/tag/v0.1.2
[0.1.1]: https://github.com/PhantomPixelDev/BetterWebSearch-MCP/releases/tag/v0.1.1
[0.1.0]: https://github.com/PhantomPixelDev/BetterWebSearch-MCP/releases/tag/v0.1.0
