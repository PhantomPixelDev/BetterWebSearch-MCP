# Changelog

All notable changes to **better-web-search-mcp** are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.9.0] - 2026-09-04

### Added
- **Request pacing per provider.** `web_research` expands a question into
  several queries and runs them in parallel across every provider, so one call
  could fire three or more requests at a single endpoint within milliseconds.
  That is what earns a DuckDuckGo challenge page, and reporting it accurately
  was the previous release; not provoking it is this one. Requests to one
  provider are now spaced by a minimum interval, with the first request never
  waiting so a single search is as fast as before. Brave is paced to 1.1s
  because its free tier allows one request per second
- **Cooldown after a refusal.** Once a provider turns us away, further requests
  fail immediately for a while rather than hammering an endpoint that is
  already blocking us. `Retry-After` is honoured when the provider sends one,
  and a second refusal during a cooldown never shortens it
- `BETTER_WEB_SEARCH_RATE_LIMIT_MS` tunes the interval; `0` disables pacing,
  which is what the test suite does so unit tests are not slowed by real waits

### Measured
- Three expanded queries run in parallel: 5 results each, **no warnings**,
  4.7s total. A full `web_research` with the browser tier enabled completes in
  14.4s with 3 queries, 7 sources and 5 citations

## [0.8.1] - 2026-09-04

### Fixed
- **The cache no longer follows the working directory.** It defaulted to the
  relative path `data/cache.db`, and an MCP client spawns the server from
  wherever it happens to be, so `data/cache.db` files accumulated around the
  filesystem — two were sitting in the home and Downloads folders — while the
  domain profiles and page cache never built up, because every launch
  directory got its own empty database. The default is now a per-user
  location: `%LOCALAPPDATA%` on Windows, `~/Library/Caches` on macOS,
  `$XDG_CACHE_HOME` or `~/.cache` elsewhere, falling back to the old relative
  path only when there is no home directory to write into.
  `BETTER_WEB_SEARCH_CACHE_PATH` still overrides, and a relative override is
  still honoured for a project-local cache

## [0.8.0] - 2026-09-04

### Fixed
- **A throttled search no longer looks like a search that found nothing.**
  DuckDuckGo answers a rate-limited request with a 2xx status and an anomaly
  page, so `response.ok` was true, parsing found no results, and the provider
  reported an empty list. That made a working `site:` query look broken, and
  it is also how a rate-limited benchmark run earlier produced a retention
  figure that read as real. Challenge pages and non-ok responses are now
  reported as `ProviderBlockedError`
- **Tool responses carry `warnings` when a provider refused.** `web_search`,
  `web_find`, `web_news` and `web_research` include the reason, so an empty
  `sources` can be read correctly:
  `["duckduckgo refused the request: rate limited (HTTP 202 challenge page)"]`
- **A refused search is no longer cached.** Caching one kept serving the empty
  result for the rest of the 15-minute TTL, long after the provider recovered
- **Query expansion no longer emits near-identical variants.** "… Type R
  review" and "… Type R reviews" were both issued, spending a provider call
  and a rank slot on the same search. Variants are now keyed on a normalized
  form that ignores case, punctuation and a trailing plural

### Added
- `aggregateSearchDetailed`, returning results together with the reason any
  provider contributed nothing. `aggregateSearch` keeps the results-only shape

## [0.7.0] - 2026-09-04

### Fixed
- **The hydration payload was still being shipped, just under a different
  field.** 0.6.0 cleaned the page `content` but left `structured_data`
  carrying the raw `__NEXT_DATA__`, so `web_extract` on a Next.js page still
  returned about 80KB. Measured on a real page: content 5,413 characters and
  structured_data 79,995, for a response of 86,170. Responses now carry
  `{ jsonLd, hydration: { present, readable_chars } }` — schema.org entities
  kept and capped, hydration containers reduced to a note of which were
  present, since their readable text is already in the page content. The same
  page now returns **8,974 characters, a 90% reduction**, with JSON-LD intact
- Found by running the server through OpenCode rather than by reading it: the
  module tests only ever asserted on `content`, so they all passed while the
  response was still 86KB

### Changed
- `structured_data` on `web_extract` results is now a summary rather than the
  raw extraction. `jsonLd` keeps its meaning; the hydration payload is gone

## [0.6.1] - 2026-09-04

### Fixed
- **A refused URL now says so.** The router swallowed the SSRF guard's error
  along with ordinary network failures, so `web_extract` on a private address
  returned an empty page at best-effort confidence 0.5. A caller could not tell
  a blocked address from a dead site, and got no reason for either. Refusals
  propagate and surface as `confidence: 0` with
  `Extraction failed: Refusing to fetch <url>: address <ip> is not public`.
  Genuine network errors still degrade quietly, as before

## [0.6.0] - 2026-09-04

### Fixed
- **`web_extract` no longer returns hydration payloads as page content.** The
  structured-data tier used `JSON.stringify` on a page's `__NEXT_DATA__` and
  called the result content, so on a Next.js site an agent received tens of
  kilobytes of braces, quoted keys and escaped markup. Measured on two real
  pages: **76,987 characters to 4,474 (94% smaller) and 77,849 to 5,413 (93%)**,
  with pages that have no hydration unchanged. Across a 34-question page
  corpus, pages containing hydration JSON went from 2 to 0
- The tier now walks the payload and keeps only prose-shaped strings, dropping
  URLs, slugs, ids and base64, de-duplicating text that appears under several
  keys, and capping the total so one page cannot flood a response. That
  preserves what the tier exists for — content a server rendered into JSON
  rather than HTML — without the machinery around it

### Notes
- Whether this also recovers the `etag-header` benchmark question is
  **unmeasured**: the provider returned no results for it while re-measuring,
  so the published 33/34 retention figure stands unchanged rather than being
  replaced by a number from a partial run

## [0.5.4] - 2026-09-04

### Fixed
- **Hydration payloads are no longer cited.** `__NEXT_DATA__`-style blobs left
  in extracted text repeat every term an article uses, so they scored well and
  took citation slots while containing nothing an agent can read. Across the
  34-question corpus this removed 2 of 168 citations, all of them markup. The
  check requires both a high punctuation share and JSON's quoted-key shape, so
  a code or config sample still counts as evidence
- Blobs are now discarded *before* the per-page passage quota rather than
  after. Dropping one that had already taken a slot silently cost that page a
  passage
- **A second article on the same host is no longer discarded as a reprint.**
  Same-host pages are one account for counting corroboration, but they are
  different writing, and treating the second as syndicated threw away material
  that may hold the answer. `IndependenceResult` now distinguishes
  `contentDuplicate` (a genuine text match) from merely sharing a cluster

### Notes
- **`etag-header` is still not retained, and is being left that way.** Three
  changes were tried against it and measured: an MMR-style novelty term for the
  fill pass, the serialized-data filter, and the content-duplicate split. Only
  the last two earned their place on other grounds, and the MMR change was
  reverted after measuring identical output. The honest reading is that at five
  citations across four independent accounts, a question whose answer sits
  fourth on one page does not make the cut, and forcing it would be tuning to
  one question. Retention stays at 33/34

## [0.5.3] - 2026-09-04

### Fixed
- **Acronym expansion now works, and the 58.3% is measured away.** The 0.5.2
  attempt shipped without moving the benchmark, and an A/B on a frozen corpus
  showed two mistakes of mine. The matcher was too loose: under the `i` flag
  `[a-z]*` also consumes uppercase, so each initial swallowed the acronym's own
  letters and a heading like "DNS definition: What does DNS stand for in
  networking" counted as an expansion, making the bonus uniform and useless.
  And the guard requiring the acronym in the same passage as the expansion
  blocked the exact case it was meant to help, since the sentence defining DNS
  or CSS routinely omits the letters
- A score bonus alone could not surface the answer either. Acronym pages are
  full of headings repeating every query term and callers keep two passages per
  page, so the defining sentence never became a candidate. Definition questions
  now order the expansion first, gated by `isDefinitionQuery` so queries that
  merely mention an acronym are untouched

### Changed
- Retention improves from **82.4% to 97.1%** overall and **58.3% to 100%** on
  acronym questions. Verified by replaying one frozen corpus so the only
  variable is the code (6/12 to 12/12, 27/34 to 33/34), then confirmed by a
  live run at the same figures
- The scraped page corpus is no longer committed. It is multi-megabyte
  third-party content and regenerable with `npm run bench:corpus -- fetch`

## [0.5.2] - 2026-09-03

### Added
- **Acronym-expansion matching in passage selection.** A question like "What
  does TLS stand for?" is answered by a sentence that states the expansion
  once, while the pages around it repeat the acronym, so BM25 ranked the
  answer below the noise. Passages that spell an acronym out now receive a
  bonus sized from the query's own mean IDF, so it stays comparable to the
  scores it is added to. Compound words are handled, so "HyperText Markup
  Language" expands HTML. Two guards keep it honest: the bare acronym does not
  count as its own expansion, and the expansion must sit alongside the acronym
  in the same passage, which stops ordinary prose such as "The lazy squirrel"
  from matching TLS
- **`npm run bench:corpus`**, which freezes a page corpus and replays it, so a
  ranking change can be A/B tested without live-web variance
- **`bench:quality` now fails a run whose baselines are mostly empty.** Below
  70% coverage it exits non-zero and says so

### Notes
- **The effect of the acronym change on the measured 58.3% is unverified.**
  The unit tests show the mechanism works on controlled input, but the live
  rerun that was meant to confirm it was rate-limited: providers returned
  nothing for 26 of 34 questions, every acronym baseline came back around 120
  characters, and the resulting figure was briefly misread as evidence the
  change had not helped. The published 82.4% and 58.3% figures are left
  unchanged until a clean run can replace them

## [0.5.1] - 2026-09-03

### Security
- **The SSRF guard was bypassable through the browser tier.** The check lived
  only in `fetchPage`, and the router deliberately swallows a fetch failure so
  the pipeline can escalate. A blocked URL therefore produced empty html,
  skipped Levels 1 and 2, and was then loaded by Playwright. Confirmed against
  a local server: the HTTP tier reported `BlockedUrlError` and the browser tier
  returned the page body, so `web_extract` on `http://127.0.0.1:.../admin`,
  RFC1918 hosts, or `169.254.169.254` still read them. Level 3 now runs the
  same guard, `mode: "browser"` is not an escape hatch, and three regression
  tests cover it. **Anyone on 0.3.0 through 0.5.0 should upgrade.**

### Changed
- **The retention benchmark grew from 12 questions to 34, and the headline
  number got worse.** Overall retention is **82.4%** (28/34), not the 91.7%
  the narrow set reported. Splitting by category shows why: numbers and status
  codes retain 100%, facts 87.5%, but **acronym expansions only 58.3% (7/12)**.
  A question like "What does TLS stand for?" keeps its query terms while the
  sentence spelling out "transport layer security" repeats none of them, so
  BM25 ranks other passages above it — the same pattern lost WAL, ACID, HTML
  and CRUD. One unlucky question at 12 questions was a measurable category
  failure at 34

### Fixed
- Injection finding offsets are rebased onto the annotated content. `index`
  was measured against the raw page while the returned `content` had the
  warning banner prepended, so every offset pointed into the banner instead of
  the suspicious span
- Passage offsets address the source exactly. Packing rebuilt the text with a
  literal blank line while `start`/`end` kept the original span, so
  `content.slice(start, end)` differed from `text` whenever the page used
  `


` or `
 
` between paragraphs — which broke the citation-anchor
  contract. Text is now sliced from the source, and trimming moves the offsets
  with it
- The research cache key carries a response-schema version. `data/cache.db`
  survives an upgrade while entries live 15 minutes, so a payload written
  before `citations` and `evidence` existed could be cast straight back to the
  current type and hand callers undefined fields

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

[0.9.0]: https://github.com/PhantomPixelDev/BetterWebSearch-MCP/releases/tag/v0.9.0
[0.8.1]: https://github.com/PhantomPixelDev/BetterWebSearch-MCP/releases/tag/v0.8.1
[0.8.0]: https://github.com/PhantomPixelDev/BetterWebSearch-MCP/releases/tag/v0.8.0
[0.7.0]: https://github.com/PhantomPixelDev/BetterWebSearch-MCP/releases/tag/v0.7.0
[0.6.1]: https://github.com/PhantomPixelDev/BetterWebSearch-MCP/releases/tag/v0.6.1
[0.6.0]: https://github.com/PhantomPixelDev/BetterWebSearch-MCP/releases/tag/v0.6.0
[0.5.4]: https://github.com/PhantomPixelDev/BetterWebSearch-MCP/releases/tag/v0.5.4
[0.5.3]: https://github.com/PhantomPixelDev/BetterWebSearch-MCP/releases/tag/v0.5.3
[0.5.2]: https://github.com/PhantomPixelDev/BetterWebSearch-MCP/releases/tag/v0.5.2
[0.5.1]: https://github.com/PhantomPixelDev/BetterWebSearch-MCP/releases/tag/v0.5.1
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
