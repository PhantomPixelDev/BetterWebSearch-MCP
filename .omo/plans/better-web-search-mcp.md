# better-web-search-mcp - Work Plan

## TL;DR (For humans)

**What you'll get:** A local MCP server that gives any AI agent genuinely better web research — instead of returning ten links, it rewrites your question into multiple angles, searches them in parallel across several providers, merges and ranks results, then opens the best pages through a smart three-step reader that pulls hidden data and falls back to a real browser only when needed.

**Why this approach:** Lock a provider abstraction first so we never depend on one search API; build a three-speed reading pipeline (fast HTTP, then hidden JSON data, then browser) because most sites fail on raw fetch alone; cache everything per-domain so the second visit is faster. This keeps v1 lean without sacrificing the differentiator.

**What it will NOT do:** No AI ranking or answer synthesis that requires an LLM key; no paid infrastructure like Redis or hosted browsers; no website UI — this is a command-line tool for AI agents, not a web app.

**Effort:** Large — ~10 focused tasks across scaffolding, search, extraction and browser work.
**Risk:** Medium — the browser layer (Playwright) is the main complexity and flakiness driver.
**Decisions to sanity-check:** Brave Search as primary with DuckDuckGo as free fallback; SQLite for cache; Playwright with a three-browser pool; five MCP tools with `web_search`/`web_research`/`web_extract` as the lean core.

Your next move: Approve this plan, then run `$start-work` (or equivalent) to begin execution. If you want ultra-rigorous review first, say so before starting.

---

> TL;DR (machine): Large effort, medium risk, TypeScript MCP server with multi-provider search, 3-tier extraction (HTTP→hydration→Playwright) and 5 tools — Brave primary, SQLite cache, domain profiler.

## Scope
### Must have
- MCP server (Stdio) built with `@modelcontextprotocol/sdk` + `zod`, exposing 5 tools: `web_search`, `web_research` (deep multi-query), `web_extract`, `web_find` (site-restricted), `web_news` (recency-filtered) matching the input shapes in the spec.
- Provider abstraction `SearchProvider` with implementations: `BraveProvider` (primary), `TavilyProvider` (if key present), `DuckDuckGoProvider` (free fallback), `SerpApiProvider` stub; aggregation via `Promise.allSettled` + dedup + rerank.
- Query utilities: `expandQueries(question)` generating 4-6 parallel variants (synonyms, translated DE variants for generic questions, site-signal hints), plus `normalizeUrl`, `freshnessToBrave` mapping for `recency_days`.
- Ranking pipeline: `deduplicate(results)` (canonical URL normalize: lowercase host, strip utm_*, trailing slash, fragment), `domainScore(host)` (curated tier list), `rerank(results, query)` combining relevance TF-IDF overlap + domainScore + recency boost.
- Extraction pipeline: `fetch.ts` (undici/fetch with UA + timeout + content-type guard), `readability.ts` (JSDOM + @mozilla/readability + turndown to Markdown), `metadata.ts` + structured extractors: `jsonLdExtractor`, `nextDataExtractor` (`#__NEXT_DATA__` + `self.__next_f.push` + `__NUXT__`/`__APOLLO_STATE__`/`__INITIAL_STATE__` regex), plus `apiIntercept` capture of JSON XHR/fetch during browser render.
- SQLite cache (`better-sqlite3`) with tables: `search_cache`, `page_cache`, `api_patterns`, `domain_profiles`; TTL eviction; helper `Cache` class.
- Browser pipeline: `BrowserPool` (3 chromium instances via `playwright`), `resource blocking` (abort image/font/media when safe), `intelligent wait` (`domcontentloaded` + Race `networkidle`/`article` selector/`innerText>1000` + DOM stability), persistent contexts with cookies.
- AccessRouter escalation: `getPage(url, mode='auto')` → Level1 HTTP fetch → hasEnoughContent? → Level2 structured data → Level3 browser+network capture → `Content Fusion` merging strategies with confidence scores (`page`/`structured_data`/`api`/`search_snippet`).
- Domain profiler + API discovery: `domainProfile` cached by domain `{requires_js, framework, has_json_ld, api_patterns, best_method}` learned after each extraction and reused to shortcut next visit (direct API call when pattern known).
- Alternative source discovery when blocked/paywalled: fallback search for title-quoted query + AMP variants (`?output=1`, `/amp`) + search-snippet as evidence with lower confidence.
- Tests (vitest) colocated per module, `npm run build` typechecks and emits `dist/`, README with env example (BRAVE_API_KEY etc.) and MCP client config.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- No LLM-powered rerank/synthesis requiring an API key in v1 — provide a `rerankWithLLM` hook stub only.
- No Redis, Postgres, or hosted browser service — SQLite + local Playwright only.
- No full Crawlee crawler abstraction — lean Playwright pool per spec section 10.
- No HTTP/WebSocket server or frontend UI — stdio MCP only.
- No hardcoded API keys or secrets; env-only via `process.env.BRAVE_API_KEY` / `TAVILY_API_KEY`; `.env.example` only.
- No paywall bypass that violates ToS — only public fallback search/AMP/syndication; no proxy/stealth exaggeration beyond UA + resource blocking.
- No `any`/`@ts-ignore` escapes, no TODO stubs, no empty catch silencers — strict TS.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: tests-after + framework `vitest` (unit) + `tsx` for ad-hoc script checks; browser integration tests mocked where chromium unavailable.
- Evidence: `.omo/evidence/task-<N>-better-web-search-mcp.md` (outside ulw-loop) or `<attemptDir>/task-<N>-better-web-search-mcp.<ext>` inside ulw-loop. Each todo must append an evidence file with command outputs.
- Per-todo QA: happy path + failure path named tool invocations (e.g., `npx vitest run src/ranking/deduplicate.test.ts`, `node dist/index.js --help` or MCP Inspector `npx @modelcontextprotocol/inspector --cli` if available, `npm run build` typecheck).
- Final wave runs `npm run lint`/`npm run build` + `npx vitest run` + manual MCP tool calls via Node harness.

## Execution strategy
### Parallel execution waves
- **Wave 1 (foundation, can run together after plan approval):** Todos 1, 2, 3 — scaffold + providers + ranking/queries are independent code surfaces.
- **Wave 2 (extraction core, depends on Wave 1 types):** Todos 4, 5, 6, 7 — extraction fetch/readability/structured, cache+profiler, browser pool, router/fusion. 4 and 5 can parallelize; 6 needs 4; 7 needs 4+6.
- **Wave 3 (tools & orchestration, depends on Wave 2):** Todos 8, 9, 10 — alternative sources + snippets as evidence, MCP tool registration, deep research orchestrator. 8 and 9 can parallelize partially; 10 needs all prior.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1. Scaffold project + MCP entry | — | 2,3,4,9 | 2,3 |
| 2. Provider abstraction + Brave/Tavily/DuckDuckGo | 1 | 3,9,10 | 1,3 |
| 3. Ranking/dedup/domainScore + query utils | 1,2 | 10 | 1,2 |
| 4. Extraction core: fetch/readability/structured | 1 | 6,7,9 | 5 |
| 5. SQLite cache + domain profiler + api_patterns | 1 | 7,10 | 4 |
| 6. Browser pool + blocking + wait + intercept | 4 | 7 | 5 |
| 7. AccessRouter escalation + Content Fusion | 4,5,6 | 9,10 | — |
| 8. Alternative source discovery + snippet evidence | 7 | 10 | 9 |
| 9. MCP tools registration (5 tools) | 1,2,4,7 | 10 | 8 |
| 10. Deep research orchestrator (web_research) | 2,3,7,8,9 | — | — |

## Todos
- [ ] 1. Scaffold TypeScript ESM project + MCP server entry
  What to do / Must NOT do: Create `package.json` (name better-web-search-mcp, type module, bin dist/index.js, scripts: build/tsc, dev/tsx watch, test/vitest run, lint/tsc --noEmit), `tsconfig.json` (ES2022, module NodeNext, strict, outDir dist, rootDir src, esModuleInterop, skipLibCheck false, resolveJsonModule), `.gitignore` (node_modules, dist, .env, .omo/evidence), `.env.example` (BRAVE_API_KEY=, TAVILY_API_KEY=, SERPAPI_KEY= optional), `src/index.ts` initializing `McpServer` {name: better-web-search-mcp, version from package.json} + `StdioServerTransport`, graceful shutdown, zod v4 import; wire `src/tools/index.ts` placeholder registration; add README skeleton with MCP config JSON. Must NOT add Redis/Crawlee; Must NOT commit .env.
  Parallelization: Wave 1 | Blocked by: — | Blocks: 2,3,4,9
  References (executor has NO interview context - be exhaustive): MCP SDK pattern McpServer+StdioServerTransport+registerTool with z.object — librarian ses_fb17e4ff docs/servers/tools.md and packages/server/src/server/mcp.examples.ts; project layout spec in user prompt better-web-search-mcp/src/{index.ts,tools/{search, research, extract, news},providers/{brave,tavily,serpapi,duckduckgo},ranking/{deduplicate,rerank,domainScore},extraction/{fetch,readability,metadata},utils/{cache,queries}}; tsconfig strict ESM guidance.
  Acceptance criteria (agent-executable): `npm install` succeeds; `npm run build` emits dist/index.js with shebang; `node dist/index.js --help` or `node --check dist/index.js` passes; `npx tsc --noEmit` zero errors; `npm test` (vitest empty) exits 0.
  QA scenarios (name the exact tool + invocation): happy — `npm run build && node dist/index.js` starts and waits on stdio (kill after 1s); evidence `.omo/evidence/task-1-better-web-search-mcp.md` captures `npm run build` + `npx tsc --noEmit` logs. failure — `BRAVE_API_KEY` missing should not crash server startup, only provider warns; run with `BRAVE_API_KEY="" npm run dev -- --dry-run` or check startup logs.
  Commit: Y | chore(scaffold): initialize ESM MCP project + stdio entry

- [ ] 2. Implement provider abstraction + Brave/Tavily/DuckDuckGo providers
  What to do / Must NOT do: Create `src/providers/types.ts` exporting `interface SearchProvider { name: string; search(query: string, opts: SearchOptions): Promise<SearchResult[]> }` where `SearchResult {title, url, snippet, published?, score?, source: string}`, `SearchOptions {count?: number, freshness?: string, recency_days?: number}`; `src/providers/brave.ts` implementing Brave Web Search GET https://api.search.brave.com/res/v1/web/search?q&count&freshness&extra_snippets=true header X-Subscription-Token, mapping `recency_days` to freshness pd/pw/pm/py or `YYYY-MM-DDtoYYYY-MM-DD`; handle no-key gracefully (return [] + console.warn); `src/providers/tavily.ts` POST https://api.tavily.com/search Authorization Bearer, map search_depth/time_range; `src/providers/duckduckgo.ts` using `duck-duck-scrape` or lightweight fetch to `https://html.duckduckgo.com/html/?q=` as free fallback (no key, parse cheerio), with timeout 8s; `src/providers/index.ts` aggregation `aggregateSearch(query, opts)` via Promise.allSettled across enabled providers, returning flat array. Must NOT hardcode keys; Must NOT use Promise.all (use allSettled so one failure doesn't kill search); Must NOT leak API error stack to caller — normalize to empty + warn.
  Parallelization: Wave 1 | Blocked by: 1 | Blocks: 3,9,10
  References (executor has NO interview context - be exhaustive): Brave API params count/freshness/extra_snippets + header X-Subscription-Token — librarian ses_fb17e4ff Brave docs; Tavily POST /search with search_depth/max_results/include_answer — same; DuckDuckGo html parsing pattern via cheerio; aggregation spec `const results=await Promise.all(providers.map(p=>p.search(query,opts)))` user prompt provider abstraction section; SearchProvider interface from user architecture.
  Acceptance criteria (agent-executable): `npx vitest run src/providers/brave.test.ts` passes: test brave headers + freshness mapping (recency_days 7→pw, 30→pm), empty on missing key; tavily mocked fetch returns mapped results; duckduckgo parse mocked HTML returns results; `npx vitest run src/providers/index.test.ts` verifies aggregation flattens and tolerates one provider throwing; `npx tsc --noEmit` zero errors.
  QA scenarios (name the exact tool + invocation): happy — mock fetch for Brave returning 2 results, assert titles/urls/snippets mapped; call `aggregateSearch` with two mocked providers returns 4 combined. failure — Brave 401/429 returns [] not throw; DuckDuckGo timeout (AbortController) returns [] ; evidence `.omo/evidence/task-2-better-web-search-mcp.md`.
  Commit: Y | feat(providers): Brave/Tavily/DuckDuckGo abstraction + aggregation

- [ ] 3. Implement ranking: deduplicate + domainScore + rerank + query utilities
  What to do / Must NOT do: Create `src/ranking/deduplicate.ts` normalizeUrl (URL parse, hostname lowercase, strip utm_* / gclid / fbclid params, remove trailing slash except root, drop hash) + dedup by normalized URL keeping highest score, also near-dup title check (exact lowercased); `src/ranking/domainScore.ts` curated tiers (e.g., wikipedia, gov, arxiv, mdn, stackoverflow high; medium for news/known tech; low for spam) returning 0-1; `src/ranking/rerank.ts` scoring = 0.5*termOverlap(query terms vs title+snippet) + 0.2*domainScore + 0.2*recencyBoost (if published within recency_days) + 0.1*originalScore normalized, sort desc; `src/utils/queries.ts` expandQueries(question:string): string[] generating 4-6 variants (original, synonym: cheap→cheapest/affordable, + DE translation for generic like "unlimited mobile internet Germany" → "unbegrenztes Datenvolumen günstig Deutschland" via small dictionary, not LLM; dedup variants). Must NOT introduce LLM call; Must NOT mutate input array; keep pure functions for testability.
  Parallelization: Wave 1 | Blocked by: 1,2 (needs SearchResult type) | Blocks: 10
  References (executor has NO interview context - be exhaustive): Ranking spec merge+deduplicate+rank by relevance+source quality user prompt; domainScore idea user prompt; query rewriting examples "unlimited mobile internet Germany cheap" etc. user prompt Killer feature deep_search steps; normalizeUrl patterns from common SEO.
  Acceptance criteria (agent-executable): `npx vitest run src/ranking/` passes: deduplicate removes utm variants + keeps highest score, domainScore returns >0.8 for wikipedia.org and <0.4 for unknown spam, rerank orders more relevant title higher, expandQueries returns 4-6 unique strings including original; `npx tsc --noEmit` zero errors.
  QA scenarios (name the exact tool + invocation): happy — dedup 3 urls where 2 are utm variants → 2 results; rerank where result A contains all query terms ranks above B. failure — empty results array handled, malformed URL in dedup skipped not thrown, query "" returns [""]; evidence `.omo/evidence/task-3-better-web-search-mcp.md`.
  Commit: Y | feat(ranking): dedup + domainScore + rerank + query expansion

- [ ] 4. Implement extraction core: fetch + readability + metadata + structured extractors
  What to do / Must NOT do: Create `src/extraction/fetch.ts` fetchPage(url, opts: {timeoutMs=10000, headers}) using native fetch with AbortController + UA "BetterWebSearch-MCP/1.0", follow redirects, guard content-type text/html only, limit body 2MB, return {html, headers, status}; `src/extraction/readability.ts` extractWithReadability(html, url) via JSDOM + @mozilla/readability (clone doc, isProbablyReaderable check, Readability(doc).parse()) + clean with DOMPurify-ish (sanitize script/style removal via cheerio prereq) and turndown to markdown, return {title, contentMarkdown, textContent, excerpt, length}; `src/extraction/metadata.ts` extractMetadata(html) via cheerio: title, description (og:description/meta description), published (article:published_time/meta property, JSON-LD datePublished), author, siteName; `src/extraction/structured.ts` extractStructuredData(html) collecting: jsonLdExtractor (querySelectorAll script[type="application/ld+json"] JSON.parse, unwrap @graph), nextDataExtractor (#__NEXT_DATA__ JSON.parse, self.__next_f.push regex concat per librarian ses_fb17e4f8), plus window.__NUXT__/__APOLLO_STATE__/__INITIAL_STATE__ regex `window\.__NUXT__\s*=\s*(\{.*?\});` etc. Return {jsonLd:[], nextData:any, nuxt:any, apollo:any}. Must NOT execute JS; Must NOT throw on malformed JSON-LD — skip silently.
  Parallelization: Wave 2 | Blocked by: 1 | Blocks: 6,7,9
  References (executor has NO interview context - be exhaustive): Readability Node+JSDOM pattern librarian ses_fb17e4ff (new JSDOM(html,{url}) + Readability); cheerio+jSDOM combo librarian ses_fb17e4f8 dialoqbase website-parser; JSON-LD extraction firecrawl/firefox-ios/rsshub librarian ses_fb17e4f8; Next __NEXT_DATA__ + self.__next_f.push regex librarian ses_fb17e4f8 (rsshub bytes/anthropic); resource HTML limit 2MB and hasEnoughContent check (>500 chars) per user spec section 1 getPage.
  Acceptance criteria (agent-executable): `npx vitest run src/extraction/` passes: fetchPage mocked 200 returns html, 404 returns status, abort on timeout; readability extracts title+markdown from sample html (cheerio pre-removes script/style); metadata extracts published date; structured extracts JSON-LD graph and __NEXT_DATA__ and __next_f chunks; `npx tsc --noEmit` zero errors.
  QA scenarios (name the exact tool + invocation): happy — sample HTML with <script type="application/ld+json">{"@type":"Article"}</script> → jsonLd length 1; sample Next page with <script id="__NEXT_DATA__"> → nextData.props found; readability on article returns length>500. failure — malformed JSON-LD skipped, empty html returns null excerpt not throw, fetch timeout returns error object; evidence `.omo/evidence/task-4-better-web-search-mcp.md`.
  Commit: Y | feat(extraction): fetch + readability + metadata + JSON-LD/Next hydration

- [ ] 5. Implement SQLite cache + domain profiler + api_patterns tables
  What to do / Must NOT do: Create `src/utils/cache.ts` class Cache using better-sqlite3 DB file `data/cache.db` (create dir if missing, WAL mode), tables: search_cache(key TEXT PRIMARY KEY, query TEXT, results TEXT, created_at INTEGER), page_cache(url TEXT PRIMARY KEY, content TEXT, extraction_method TEXT, confidence REAL, created_at INTEGER), api_patterns(id INTEGER PK, domain TEXT, endpoint_pattern TEXT, method TEXT, content_type TEXT, discovered_at INTEGER), domain_profiles(domain TEXT PRIMARY KEY, profile TEXT JSON, updated_at INTEGER); methods getSearch/setSearch (TTL 15min), getPage/setPage (TTL 1h), getDomain/setDomain, addApiPattern/getApiPatterns(domain), pruneExpired(); `src/utils/domainProfile.ts` helpers detectFramework(html) (checks __NEXT_DATA__, self.__next_f, __NUXT__, etc. → "Next.js"/"Nuxt"/"unknown"), profileFor(domain, html, extractionResult) building {requires_js:boolean (hasEnoughContent false initially true), framework, has_json_ld, api_patterns:[], best_method: "hydration_data"|"readability"|"browser_api_intercept"}. Gracefully fallback to in-memory Map if better-sqlite3 unavailable (for CI). Must NOT block on DB errors; Must NOT store secrets.
  Parallelization: Wave 2 | Blocked by: 1 | Blocks: 7,10
  References (executor has NO interview context - be exhaustive): Spec section site capability profiler JSON shape; api_patterns table spec CREATE TABLE api_patterns(domain TEXT, endpoint_pattern TEXT, method TEXT, content_type TEXT, discovered_at DATETIME); SQLite cache spec "SQLite cache" user v1 stack; domainProfile best_extraction_method values hydration_data/browser_api_intercept/readability.
  Acceptance criteria (agent-executable): `npx vitest run src/utils/cache.test.ts` passes: setSearch then getSearch hits within TTL and misses after TTL mock, page_cache roundtrip, api_patterns insert+get by domain, domain_profiles upsert; `npx tsc --noEmit` zero errors; `ls data/cache.db` exists after test.
  QA scenarios (name the exact tool + invocation): happy — Cache.getSearch returns parsed results; pruneExpired deletes old rows. failure — invalid JSON in profile column handled, DB file missing dir auto-created, concurrent writes not throwing; evidence `.omo/evidence/task-5-better-web-search-mcp.md`.
  Commit: Y | feat(cache): SQLite cache + domain profiler + api_patterns

- [ ] 6. Implement browser pool + resource blocking + intelligent wait + API interception
  What to do / Must NOT do: Create `src/extraction/browser.ts` BrowserPool class: lazy launch playwright.chromium.launch({headless:true, args:['--no-sandbox']}), pool size 3 (create contexts on demand, reuse), method renderWithBrowser(url, opts): {create page, setup route blocking `page.route("**/*", route=> resourceType in ["image","font","media"] ? abort: continue)`, setup response capture array, goto with waitUntil domcontentloaded timeout 15000, then intelligent wait `Promise.race([page.waitForLoadState("networkidle",{timeout:4000}).catch(()=>{}), page.waitForSelector("article",{timeout:4000}).catch(()=>{}), page.waitForFunction(()=>document.body.innerText.length>1000,{timeout:4000}).catch(()=>{})])` + DOM stability poll (check innerText growth stops), then `page.content()`; cleanup page close on error; `src/extraction/apiIntercept.ts` helper installApiCapture(page) → page.on("response", async resp=> if content-type includes application/json then try resp.json() capture {url, data}) returning captured array; also export `discoverApiPatterns(domain, captured)` to normalize to api_patterns rows. Must NOT launch browser per request (reuse pool); Must NOT waitForTimeout(5000) bare; Must handle playwright not installed gracefully (throw actionable error prompting npx playwright install chromium).
  Parallelization: Wave 2 | Blocked by: 4 (needs cheerio/readability for fusion later) | Blocks: 7
  References (executor has NO interview context - be exhaustive): User spec sections 3 browser rendering fallback (waitForFunction text.length>500, waitForContent Race, page.route resource blocking), section 4 intercept API calls page.on("response") capturing json, section 10 browser pool + resource blocking block image/font/media; librarian ses_fb17e4f8 wait strategies (domcontentloaded/networkidle/selector) and resource blocking via page.route + resourceType; Playwright docs page.route vs page.on response.
  Acceptance criteria (agent-executable): `npx vitest run src/extraction/browser.test.ts` passes with mocked playwright (unit tests for blocking predicate, wait logic, pool lifecycle); if chromium installed `npx playwright install --dry-run` or mocked integration renders local html file and captures network json; `npx tsc --noEmit` zero errors.
  QA scenarios (name the exact tool + invocation): happy — mocked page where image route aborted and json response captured → captured array length 1 with url /api/products/123. failure — goto timeout returns partial html not throw, missing playwright binary returns clear error message "Run npx playwright install chromium", pool close cleans up; evidence `.omo/evidence/task-6-better-web-search-mcp.md`.
  Commit: Y | feat(browser): pool + resource blocking + intelligent wait + API intercept

- [ ] 7. Implement AccessRouter escalation + Content Fusion
  What to do / Must NOT do: Create `src/extraction/router.ts` export `async function getPage(url, opts={mode:'auto', include_api_data:true, include_structured_data:true, browser_fallback:true})` implementing escalation: Level1 fetchPage → if !html or hasEnoughContent(html) (readability text length>500 after stripping) return readability extraction with method http_fetch confidence 0.85; else Level2 extractStructuredData → if jsonLd|nextData present with content length>200 return structured with method hydration_data confidence 0.90 (or 0.95 for JSON-LD product); else if !browser_fallback return best-effort Level1 result; else Level3 renderWithBrowser + installApiCapture + extract DOM + captureApiResponses → return browser_api_intercept confidence 0.96 if api captured else 0.90 for rendered_dom. Create `src/extraction/fusion.ts` fuseContent(strategiesResults[]) merging: strategies = [readabilityExtractor, jsonLdExtractor, nextJsExtractor, apiResponseExtractor, metadataExtractor] as per spec, scoring each (api 0.99, jsonld 0.95, rendered 0.90, readability 0.85, metadata 0.60) and choosing highest-confidence content but including structured_data and api_endpoints in return; also update domainProfile and api_patterns tables. Return shape {url,title,content,extraction:{method,confidence,rendered},structured_data,api_endpoints,metadata}. Must NOT always use browser; Must NOT duplicate browser launch when cache hits.
  Parallelization: Wave 2 | Blocked by: 4,5,6 | Blocks: 9,10
  References (executor has NO interview context - be exhaustive): User spec section 1 escalation getPage(html→hasEnoughContent→extractStructured→renderWithBrowser), section 2 extract data BEFORE rendering (JSON-LD, __NEXT_DATA__, etc.) diagram, section 6 multi-strategy extraction fusion with scores, section 7 alternative sources, response shape with extraction.method confidence api_endpoints; confidence values from spec.
  Acceptance criteria (agent-executable): `npx vitest run src/extraction/router.test.ts src/extraction/fusion.test.ts` passes: fast path returns without browser mock, structured path short-circuits browser, browser path called only when needed, fuseContent picks api over readability; cache hit for page_cache skips fetch; `npx tsc --noEmit` zero errors.
  QA scenarios (name the exact tool + invocation): happy — url with simple article html returns method http_fetch rendered false; url with only __NEXT_DATA__ returns hydration_data; JS-heavy mocked page falls back to browser and returns api_endpoints. failure — fetch 403 falls through to browser then to snippet fallback, invalid url throws zod-validated error not crash; evidence `.omo/evidence/task-7-better-web-search-mcp.md`.
  Commit: Y | feat(router): AccessRouter escalation + Content Fusion

- [ ] 8. Implement alternative source discovery + search-snippet evidence
  What to do / Must NOT do: Create `src/extraction/alternative.ts` export `findAlternativeSources(url, title, opts)` implementing when extraction confidence <0.5 or status 403/paywall: generate URL variants [original, "?output=1", "/amp", "?amp"], try fetch each; if still blocked, run `aggregateSearch` with quoted title `"exact title"` and `site:domain.com "title"` and `author+keywords`, treat top search snippets as evidence with type search_snippet confidence 0.6; Create `src/extraction/evidence.ts` type Evidence {source, type: "page"|"api"|"structured_data"|"search_snippet", confidence:number, url, snippet?}. Wire into router as final fallback before returning low-confidence result. Must NOT violate ToS; only public search + AMP.
  Parallelization: Wave 3 | Blocked by: 7 | Blocks: 10
  References (executor has NO interview context - be exhaustive): User spec section 7 Alternative source discovery (paywall→search exact title/quoted first paragraph/author headline, find syndication/RSS/AMP, try URL variants /amp/?output=1, site:domain.com queries), section 8 Search snippets as underrated data source with Evidence interface source/type/confidence.
  Acceptance criteria (agent-executable): `npx vitest run src/extraction/alternative.test.ts` passes: mocked blocked fetch returns snippet evidence, AMP variant tried before snippet, site: query generated; evidence type search_snippet confidence 0.6; `npx tsc --noEmit` zero errors.
  QA scenarios (name the exact tool + invocation): happy — article blocked → alternative search returns 2 snippet evidences. failure — no title provided still generates site: fallback, empty search results returns low confidence page evidence not throw; evidence `.omo/evidence/task-8-better-web-search-mcp.md`.
  Commit: Y | feat(extraction): alternative sources + snippet evidence

- [ ] 9. Register MCP tools (web_search, web_extract, web_find, web_news) + config
  What to do / Must NOT do: Create `src/tools/search.ts` register web_search (input: query string min1, max_results 1-20 default10, recency_days optional 0-365 → freshness, count, include snippet) handler calls aggregateSearch→deduplicate→rerank→slice→return {answer:"Top N results for ...", sources:[{title,url,snippet,published,relevance}], queries_used:[query]}; `src/tools/extract.ts` web_extract (urls string[] min1, mode enum auto/fast/browser default auto, include_api_data bool, include_structured_data bool, browser_fallback bool) handler loops urls via getPage + fuseContent returning per-url extraction object matching spec response; `src/tools/find.ts` web_find (query, site string, max_results) → site-restricted search via aggregateSearch with `site:${site} ${query}`; `src/tools/news.ts` web_news (topic string, recency_days default7, max_results default10) → calls Brave/Tavily with freshness tight, adds timeline grouping by published date, source diversity via domain dedup; `src/tools/index.ts` register all tools on McpServer with zod schemas and descriptions; wire cache read-through (check search_cache before provider). Add MCP Inspector smoke script `scripts/smoke.mjs`. Must NOT expose secrets in responses; Must validate inputs with zod exactly as spec shapes.
  Parallelization: Wave 3 | Blocked by: 1,2,4,7 | Blocks: 10
  References (executor has NO interview context - be exhaustive): Spec MCP tools: web_search {query,max_results,recency_days}, web_research multi-query, web_extract {urls}, web_find, web_news with recent filtering/source diversity/timeline; example output {answer,sources:[{title,url,snippet,published,relevance}],queries_used}; Brave freshness mapping; provider aggregation from todo2; extraction fusion from todo7.
  Acceptance criteria (agent-executable): `npx vitest run src/tools/search.test.ts src/tools/extract.test.ts` passes: web_search mocked providers returns structured JSON with sources sorted by relevance, web_extract mocked getPage returns extraction.method; `npm run build` succeeds; Node harness `node scripts/smoke.mjs` (or `npx tsx scripts/smoke.mjs`) calls handlers directly and prints JSON without crashing.
  QA scenarios (name the exact tool + invocation): happy — web_search "Laravel 12 authentication" returns 3 sources with relevance 0-1; web_extract with 2 urls returns both extractions. failure — invalid input (empty query, bad url) returns MCP error with zod message, not throw; missing BRAVE_API_KEY still returns DuckDuckGo results; evidence `.omo/evidence/task-9-better-web-search-mcp.md`.
  Commit: Y | feat(tools): web_search + web_extract + web_find + web_news registration

- [ ] 10. Implement deep research orchestrator (web_research / deep_search)
  What to do / Must NOT do: Create `src/tools/research.ts` register `web_research` (alias deep_search) input {question string min1, depth enum "quick"|"deep" default deep, recency_days optional, count_per_query default5} handler does: 1) analyze query → expandQueries to 4-6 variants (reuse todo3), 2) parallel searches `Promise.all(queries.map(q=>aggregateSearch(q, opts)))` 3) merge flat → deduplicate → rerank (reuse todo3) 4) open top 10 pages via `getPage` in parallel (concurrency 3) capped 8s each 5) extract via fusion 6) return structured research {answer: synthesized snippet joining top excerpts with source citations (no LLM, just extractive join "Based on N sources..."), sources:[{title,url,snippet,published,relevance}], queries_used, extraction_stats:{method_counts, avgConfidence}}. Also respect recency_days for all searches and extracts (filter older). Cache research result via search_cache keyed by question+depth. Must NOT do N+1 sequential fetches; Must use concurrency limiting (p-limit style simple Promise pool of 3).
  Parallelization: Wave 3 | Blocked by: 2,3,7,8,9 | Blocks: —
  References (executor has NO interview context - be exhaustive): Killer feature deep_search internals 1.Analyze query →2.Generate alternative searches (examples cheapest unlimited mobile internet Germany deep queries with DE variants) →3.Search all queries parallel →4.Merge+deduplicate →5.Rank →6.Open top10 →7.Extract →8.Return structured research example output {answer,sources:[...],queries_used}; spec research tool {question,depth,recency_days}.
  Acceptance criteria (agent-executable): `npx vitest run src/tools/research.test.ts` passes: mocked aggregateSearch + getPage returns 2 sources, queries_used length 4-6, sources sorted, answer contains citation count; all parallel searches invoked (verify fetch mock call count); `npx tsc --noEmit` zero errors; build still passes.
  QA scenarios (name the exact tool + invocation): happy — question "cheapest unlimited mobile internet Germany" with depth deep + recency_days 30 mocked returns answer + 3 sources with published dates within 30d; evidence includes method_counts. failure — no results returns {answer:"No results found", sources:[]} not throw; one failing getPage doesn't abort others (Promise.allSettled semantics); timeout on extraction returns partial results; evidence `.omo/evidence/task-10-better-web-search-mcp.md`.
  Commit: Y | feat(tools): web_research deep orchestrator

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [ ] F1. Plan compliance audit
- [ ] F2. Code quality review
- [ ] F3. Real manual QA
- [ ] F4. Scope fidelity

## Commit strategy
- Conventional commits per todo (chore, feat, feat...); final wave no commit, only verification report.
- Branch discipline: work on main (repo empty) or feature/better-web-search-mcp if git initialized; each todo commit atomic.
- Evidence files committed under .omo/evidence/ for traceability.

## Success criteria
- `npm run build` exits 0 and `dist/index.js` is executable MCP stdio server.
- `npx tsc --noEmit` zero errors, `npm run lint` (if present) zero errors.
- `npx vitest run` all tests pass (at least 30 tests covering providers, ranking, extraction, cache, router).
- MCP Inspector or direct Node harness can call `web_search`, `web_extract`, `web_research` and receive spec-shaped JSON with sources, queries_used, extraction.method/confidence.
- No provider hardcodes secrets; env-only; no `any` escapes; strict TS passes.
- Domain profiler learns after extraction and api_patterns table populates after browser render.
