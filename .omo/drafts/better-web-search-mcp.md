---
slug: better-web-search-mcp
status: awaiting-approval
intent: clear
review_required: false
pending-action: write .omo/plans/better-web-search-mcp.md
approach: Build BetterWebSearch MCP as TypeScript ESM with 3-tier extraction (Fast HTTP → Smart hydration → Browser Playwright), provider abstraction, parallel query expansion, dedup/rerank, SQLite cache + domain profiler, and 5 MCP tools (web_search, web_research/deep_search, web_extract, web_find, web_news).
---

# Draft: better-web-search-mcp

## Components (topology ledger)
| id | outcome | status | evidence path |
|---|---|---|---|
| C1 | Project scaffold + MCP server entry (Stdio) | active | src/index.ts, package.json, tsconfig.json |
| C2 | Provider abstraction + Brave/Tavily/DuckDuckGo | active | src/providers/*.ts |
| C3 | Query expansion + ranking/deduplication | active | src/utils/queries.ts, src/ranking/*.ts |
| C4 | Extraction core (fetch+readability+structured) | active | src/extraction/*.ts |
| C5 | SQLite cache + domain profiler + API patterns | active | src/utils/cache.ts, src/utils/domainProfile.ts |
| C6 | Browser pipeline (pool, blocking, wait, intercept) | active | src/extraction/browser.ts, src/extraction/apiIntercept.ts |
| C7 | AccessRouter escalation + Content Fusion | active | src/extraction/router.ts, src/extraction/fusion.ts |
| C8 | MCP tools (5 tools) + deep research orchestrator | active | src/tools/*.ts |

## Open assumptions (announced defaults)
| assumption | adopted default | rationale | reversible? |
|---|---|---|---|
| Node version | Node 20+ ESM | MCP SDK + Playwright require modern Node; ESM is SDK standard | yes |
| Validation | zod v4 (zod@^3.22 or ^4) | MCP SDK examples use zod; keeps tool schemas typesafe | yes |
| Primary search provider | Brave Search API (Web Search + optional LLM Context) | User spec: Brave primary, cheapest low latency; free tier exists | yes |
| Fallback | DuckDuckGo (no key) + Tavily (if key present) | DuckDuckGo is free fallback per spec; Tavily is AI-optimized | yes |
| Cache | better-sqlite3 with TTL tables | Sync API, zero daemon, perfect for MCP stdio process; Redis deferred | yes |
| Browser | playwright (chromium) with 3-instance pool | Matches spec browser pool; avoids heavy Crawlee for v1 | yes |
| Turndown | turndown for HTML→Markdown | Standard for readability pipeline | yes |
| Deep research LLM rerank | deferred to v2; use TF-IDF+recency+domainScore for v1 | User said optional LLM reranking later | yes |

## Findings (cited - path:lines)
- Repo empty: only .omo/drafts + run-continuation exist; no package.json/tsconfig/src (explore ses_fb17eeae)
- MCP SDK pattern: McpServer + StdioServerTransport + registerTool with z.object inputSchema (librarian ses_fb17e4ff - server/mcp.examples.ts, docs/servers/tools.md)
- Brave API: GET https://api.search.brave.com/res/v1/web/search?q=...&count&freshness=pd/pw/pm/py, header X-Subscription-Token; LLM Context endpoint supports maximum_number_of_tokens & context_threshold_mode (librarian ses_fb17e4ff)
- Tavily: POST https://api.tavily.com/search Authorization Bearer tvly-..., params search_depth/max_results/include_answer/include_raw_content (librarian ses_fb17e4ff)
- Readability: new Readability(jsdom.window.document).parse() returns {title,content,textContent,excerpt,byline}; isProbablyReaderable check; use JSDOM + DOMPurify for untrusted (librarian ses_fb17e4ff)
- Playwright intercept: page.route('**/*', handler) + page.on('response',...) capturing application/json; wait strategies domcontentloaded/load/networkidle + selector wait; resource blocking via request.resourceType() abort for image/font/media (librarian ses_fb17e4ff + ses_fb17e4f8)
- JSON-LD extraction: querySelectorAll('script[type="application/ld+json"]') JSON.parse, unwrap @graph (librarian ses_fb17e4f8 - firecrawl, firefox-ios, rsshub)
- Next.js hydration: Pages Router script#__NEXT_DATA__ JSON.parse(.text()); App Router self.__next_f.push([1, "..."]) regex concat (librarian ses_fb17e4f8 - rsshub bytes, scrapeless)
- Hydration blobs also include window.__NUXT__, __APOLLO_STATE__, __INITIAL_STATE__ (user spec section 2)

## Decisions (with rationale)
- ESM + tsx for dev, tsc for build to dist/ ; bin points to dist/index.js with #!/usr/bin/env node
- Provider interface: SearchProvider.search(query, options): Promise<SearchResult[]> ; options {count, freshness, extraSnippets}; aggregate via Promise.allSettled, dedup, rerank
- Deduplication: normalizeUrl (lowercase host, strip utm_*, trailing slash, hash), + exact normalized equality; keep highest score
- Ranking: score = 0.6*relevance (query term overlap) + 0.2*domainScore (curated list) + 0.2*recency (if published date exists)
- Query expansion: generate 4-6 variants via synonyms + lightweight i18n (de example) — no LLM needed for v1; parallel searches
- Escalation: fastFetch → hasEnoughContent(text.length>500) ? readability : extractStructured (JSON-LD/Next) → browser fallback
- Browser pool: 3 pages, persistent contexts, block image/font/media/stylesheet via route, intelligent wait Race(networkidle, article selector, innerText>1000)
- API intercept: page.on('response', capture json) store per-domain api_patterns for next-visit direct call optimization (spec section 5)
- Domain profiler cached by domain: {requires_js, framework, has_json_ld, api_patterns, best_method}
- Tools: web_search (fast), web_research (multi-angle deep), web_extract (multi-layer), web_find (site-restricted), web_news (freshness-filtered). Input schemas via zod.

## Scope IN
- MCP server stdio with 5 tools meeting spec input shapes
- Multi-provider abstraction (Brave primary, Tavily, DuckDuckGo) with env var keys (BRAVE_API_KEY, TAVILY_API_KEY optional)
- Query rewriting + parallel searches + deduplication + ranking + domainScore
- 3-tier extraction pipeline with structured data pre-browser + browser fallback + API interception + content fusion
- SQLite cache (search_cache, page_cache, api_patterns, domain_profiles) with TTL and domain-profile learning
- Alternative source discovery via title-quoted fallback search (when paywall/block)
- Unit tests via vitest for ranking, dedup, queries, extraction helpers
- README + example env

## Scope OUT (Must NOT have)
- No LLM-powered reranking or synthesis in v1 (deferred; provide hooks)
- No Redis / external infra — SQLite only for v1
- No Crawlee full crawler — Playwright pool only for v1
- No frontend/UI — MCP stdio only, no HTTP server
- No paid SERP API beyond Brave/Tavily env keys; no hardcoded secrets
- No destructive crawling or paywall bypass beyond public AMP/syndication search fallbacks

## Open questions
- None remaining — user spec is decision-complete; defaults announced above and reversible.

## Approval gate
status: awaiting-approval
approach: 10 todos across 3 waves (scaffold→core→tools), tests-after with vitest, 3-tier extraction is load-bearing.
pending-action: write .omo/plans/better-web-search-mcp.md then await user approval to start work
