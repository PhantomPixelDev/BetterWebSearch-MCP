/**
 * `web_research` MCP tool (alias `deep_search`).
 *
 * Deep research orchestrator. Rewrites a question into multiple search
 * variants, runs them in parallel across providers, merges/deduplicates/ranks
 * the results, opens the top pages through the AccessRouter extraction
 * pipeline (bounded concurrency, per-page timeout), and synthesizes an
 * extractive answer with source citations. No LLM is involved — the answer is
 * a deterministic join of the top excerpts.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { aggregateSearch } from "../providers/index.js";
import { deduplicate } from "../ranking/deduplicate.js";
import { rerank, type RankedResult } from "../ranking/rerank.js";
import { expandQueries } from "../utils/queries.js";
import { freshnessFromRecencyDays } from "../providers/brave.js";
import { getPage, type RoutedPage } from "../extraction/router.js";
import { Cache } from "../utils/cache.js";
import { selectPassages, tokenize } from "../ranking/passages.js";
import {
  analyzeIndependence,
  countIndependent,
  type IndependenceResult,
} from "../ranking/independence.js";
import type { SearchSource } from "./search.js";

/** Input schema for `web_research`. */
export const researchInputSchema = {
  question: z.string().min(1, "question must not be empty"),
  depth: z.enum(["quick", "deep"]).default("deep"),
  recency_days: z.number().int().min(0).max(365).optional(),
  count_per_query: z.number().int().min(1).max(10).default(5),
};

/** The spec-shaped `web_research` response. */
/** Whether a source is an independent account or a copy of another. */
export interface SourceIndependence {
  /** Index of the content cluster this source belongs to. */
  cluster: number;
  /** Whether this source is the representative of its cluster. */
  primary: boolean;
  /** How many other opened sources share this cluster. */
  duplicates: number;
}

/** A span of a source page that supports the answer. */
export interface Citation {
  /** 1-based index into `sources`. */
  citation: number;
  /** The source URL the span was taken from. */
  url: string;
  /** The source title. */
  title: string;
  /** The supporting text, verbatim from the extracted content. */
  quote: string;
  /** Character offset of the quote within that page's extracted content. */
  start: number;
  /** Character offset of the quote end. */
  end: number;
  /** Relevance of the span to the question. Higher is stronger. */
  relevance: number;
}

export interface ResearchResponse {
  answer: string;
  sources: SearchSource[];
  queries_used: string[];
  /**
   * The exact spans the answer was assembled from, so an agent can attribute a
   * statement to a span rather than to a whole page.
   */
  citations: Citation[];
  /**
   * Countable facts about the evidence behind the answer.
   *
   * Every field is something the server measured, not a judgement: there is no
   * language model here to score truth or agreement, and an invented
   * confidence number would be worse than none. An agent can use these to
   * decide whether to research further.
   */
  evidence: {
    /** Pages actually opened and extracted. */
    sources_opened: number;
    /**
     * Distinct content clusters among those pages. Syndicated reprints and
     * multiple pages from one host collapse into a single cluster, so this is
     * the number of genuinely separate accounts.
     */
    independent_sources: number;
    /** Pages that duplicate another page's content or host. */
    derivative_sources: number;
    /**
     * Fraction of the question's content words that appear in the cited
     * passages, 0..1. Low values mean the citations may not address the
     * question, not that the answer is wrong.
     */
    query_term_coverage: number;
    /** Number of cited spans in `citations`. */
    cited_spans: number;
  };
  extraction_stats: {
    method_counts: Record<string, number>;
    avgConfidence: number;
  };
}

/** Milliseconds per day. */
const MS_PER_DAY = 86_400_000;

/** Per-page extraction timeout, in milliseconds. */
const PAGE_TIMEOUT_MS = 8_000;

/** Concurrency limit for opening pages. */
const CONCURRENCY = 3;

/** Maximum number of pages to open for extraction. */
const MAX_PAGES = 10;

/** Passages considered from each page before the cross-page ranking. */
const PASSAGES_PER_PAGE = 2;

/** Maximum number of excerpts joined into the answer. */
const MAX_EXCERPTS = 5;

/** Map a ranked result to the spec-shaped source entry. */
function toSource(result: RankedResult): SearchSource {
  return {
    title: result.title,
    url: result.url,
    snippet: result.snippet,
    published: result.published,
    relevance: result.relevance,
  };
}

/** Whether a result was published within the recency window. */
function withinWindow(published: string | undefined, recencyDays: number): boolean {
  if (published === undefined || published === "") {
    return true;
  }
  const time = Date.parse(published);
  if (Number.isNaN(time)) {
    return true;
  }
  return time >= Date.now() - recencyDays * MS_PER_DAY;
}

/** A page extraction outcome, either a routed page or a failure reason. */
type PageOutcome =
  | { ok: true; page: RoutedPage }
  | { ok: false; reason: string };

/** Run a single page through getPage with an 8s timeout. */
async function openPage(url: string, cache: Cache | undefined): Promise<PageOutcome> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`page extraction timed out after ${PAGE_TIMEOUT_MS}ms`)),
      PAGE_TIMEOUT_MS,
    );
  });

  try {
    const page = await Promise.race([getPage(url, {}, { cache }), timeout]);
    return { ok: true, page };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { ok: false, reason };
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}

/** Open the top pages with bounded concurrency, tolerating individual failures. */
async function openPages(
  urls: readonly string[],
  cache: Cache | undefined,
): Promise<RoutedPage[]> {
  const outcomes: PageOutcome[] = new Array(urls.length);
  let cursor = 0;

  async function worker(): Promise<void> {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= urls.length) {
        return;
      }
      outcomes[index] = await openPage(urls[index] ?? "", cache);
    }
  }

  const workers = Array.from(
    { length: Math.min(CONCURRENCY, urls.length) },
    () => worker(),
  );
  await Promise.all(workers);

  return outcomes.flatMap((outcome) => (outcome.ok ? [outcome.page] : []));
}

/** Build the extractive answer from the top page excerpts with citations. */
/**
 * Pick the spans of the opened pages that actually address the question.
 *
 * The previous implementation took the first 400 characters of each page and
 * never looked at the question, so the "answer" was usually page intros and
 * boilerplate. Passages are now scored against the question with BM25 and the
 * best ones returned with their offsets, which raises the signal and cuts the
 * token count, since only matching paragraphs are included.
 */
export function collectCitations(
  pages: readonly RoutedPage[],
  sources: readonly SearchSource[],
  question: string,
  limit = MAX_EXCERPTS,
  independence: readonly IndependenceResult[] = [],
): Citation[] {
  const candidates: Array<Citation & { score: number }> = [];

  pages.forEach((page, index) => {
    const content = page.content.trim();
    if (content === "") {
      return;
    }
    // A derivative source republishes another source's text. Quoting it adds
    // no evidence and, once the breadth pass has run, the remaining slots
    // would otherwise be filled with the same story under a second byline.
    if (independence[index]?.primary === false) {
      return;
    }
    const source = sources[index];
    for (const passage of selectPassages(content, question, PASSAGES_PER_PAGE)) {
      candidates.push({
        citation: index + 1,
        url: source?.url ?? page.url,
        title: source?.title ?? page.title,
        quote: passage.text,
        start: passage.start,
        end: passage.end,
        relevance: Number(passage.score.toFixed(4)),
        score: passage.score,
      });
    }
  });

  candidates.sort((a, b) => b.score - a.score);

  // Prefer breadth across independent accounts. Spreading over distinct URLs
  // is not enough: five outlets running one wire story would fill every slot
  // with the same text and present it as five corroborating sources.
  const groupOf = (citation: number): number =>
    independence[citation - 1]?.cluster ?? citation;

  const chosen: Array<Citation & { score: number }> = [];
  const usedGroups = new Set<number>();
  for (const candidate of candidates) {
    if (chosen.length >= limit) {
      break;
    }
    const group = groupOf(candidate.citation);
    if (!usedGroups.has(group)) {
      usedGroups.add(group);
      chosen.push(candidate);
    }
  }
  // Remaining slots go to further passages from those same independent
  // accounts, which adds depth without re-reporting one story twice.
  for (const candidate of candidates) {
    if (chosen.length >= limit) {
      break;
    }
    if (!chosen.includes(candidate)) {
      chosen.push(candidate);
    }
  }

  return chosen
    .sort((a, b) => a.citation - b.citation || b.score - a.score)
    .map(({ score, ...citation }) => {
      void score;
      return citation;
    });
}

/** Assemble the answer text from the selected citation spans. */
function buildAnswer(
  pages: readonly RoutedPage[],
  citations: readonly Citation[],
): string {
  if (pages.length === 0 || citations.length === 0) {
    return "No results found";
  }
  const body = citations
    .map((citation) => `[${citation.citation}] ${citation.quote}`)
    .join("\n\n");
  return `Based on ${pages.length} sources:\n\n${body}`;
}

/**
 * Fraction of the question's content words that appear in the cited passages.
 *
 * A blunt but honest measure of whether the citations engage with the question
 * at all. It says nothing about correctness, which is not something this
 * server can determine.
 */
export function queryTermCoverage(
  question: string,
  citations: readonly Citation[],
): number {
  const terms = new Set(tokenize(question));
  if (terms.size === 0) {
    return 0;
  }
  const cited = new Set(tokenize(citations.map((c) => c.quote).join(" ")));
  let hits = 0;
  for (const term of terms) {
    if (cited.has(term)) {
      hits += 1;
    }
  }
  return Number((hits / terms.size).toFixed(4));
}

/** Aggregate extraction stats across the opened pages. */
function extractionStats(pages: readonly RoutedPage[]): {
  method_counts: Record<string, number>;
  avgConfidence: number;
} {
  const methodCounts: Record<string, number> = {};
  let confidenceSum = 0;

  for (const page of pages) {
    const method = page.extraction.method;
    methodCounts[method] = (methodCounts[method] ?? 0) + 1;
    confidenceSum += page.extraction.confidence;
  }

  const avgConfidence = pages.length === 0 ? 0 : confidenceSum / pages.length;
  return { method_counts: methodCounts, avgConfidence };
}

/**
 * Run a deep research query and return the spec-shaped response.
 *
 * Exported separately so tests and the smoke harness can call the handler
 * logic directly.
 */
export async function runResearch(args: {
  question: string;
  depth?: "quick" | "deep";
  recency_days?: number;
  count_per_query?: number;
  cache?: Cache;
}): Promise<ResearchResponse> {
  const question = args.question;
  const depth = args.depth ?? "deep";
  const recencyDays = args.recency_days;
  const countPerQuery = args.count_per_query ?? 5;
  const cache = args.cache;

  const cacheKey = `research:${question}:${depth}:${recencyDays ?? "any"}:${countPerQuery}`;
  const cached = cache?.getSearch(cacheKey);
  if (cached !== null && cached !== undefined) {
    return cached as ResearchResponse;
  }

  // 1) Expand the question into search variants (quick uses fewer).
  const expanded = expandQueries(question);
  const queries = depth === "quick" ? expanded.slice(0, 2) : expanded;

  // 2) Run all searches in parallel across providers.
  const freshness = recencyDays === undefined
    ? undefined
    : freshnessFromRecencyDays(recencyDays);
  const settled = await Promise.all(
    queries.map((query) =>
      aggregateSearch(query, {
        count: countPerQuery,
        freshness,
        recency_days: recencyDays,
        extraSnippets: true,
      }),
    ),
  );

  // 3) Merge flat, deduplicate, and re-rank against the original question.
  const merged = settled.flat();
  const deduped = deduplicate(merged);
  const ranked = rerank(deduped, question, recencyDays ?? 30);

  // Respect the recency filter on published dates.
  const filtered = recencyDays === undefined
    ? ranked
    : ranked.filter((r) => withinWindow(r.published, recencyDays));

  const top = filtered.slice(0, MAX_PAGES);
  const sources = top.map(toSource);

  // 4) Open the top pages in parallel (bounded concurrency, per-page timeout).
  const pages = await openPages(
    top.map((r) => r.url),
    cache,
  );

  // 5) Work out which pages are genuinely separate accounts before citing, so
  // syndicated copies do not masquerade as corroboration.
  const independence = analyzeIndependence(
    pages.map((page, index) => ({
      url: sources[index]?.url ?? page.url,
      content: page.content,
    })),
  );

  // 6) Select the spans that address the question, and cite them.
  const citations = collectCitations(
    pages,
    sources,
    question,
    MAX_EXCERPTS,
    independence,
  );

  const independentSources = countIndependent(independence);
  const response: ResearchResponse = {
    answer: buildAnswer(pages, citations),
    sources,
    queries_used: queries,
    citations,
    evidence: {
      sources_opened: pages.length,
      independent_sources: independentSources,
      derivative_sources: Math.max(0, pages.length - independentSources),
      query_term_coverage: queryTermCoverage(question, citations),
      cited_spans: citations.length,
    },
    extraction_stats: extractionStats(pages),
  };

  cache?.setSearch(cacheKey, question, response);
  return response;
}

/** Register the `web_research` tool (alias `deep_search`) on the given MCP server. */
export function registerResearch(server: McpServer, cache?: Cache): void {
  server.registerTool(
    "web_research",
    {
      title: "Web Research",
      description:
        "Deep research orchestrator. Rewrites a question into multiple search variants, searches them in parallel across providers, ranks the results, opens the top pages to extract content, and returns a synthesized answer with source citations, the ranked sources, the queries used, and extraction statistics.",
      inputSchema: researchInputSchema,
    },
    async (args) => {
      const response = await runResearch({ ...args, cache });
      return {
        content: [{ type: "text", text: JSON.stringify(response) }],
      };
    },
  );

  server.registerTool(
    "deep_search",
    {
      title: "Deep Search",
      description:
        "Alias for web_research. Deep research orchestrator that rewrites a question into multiple search variants, searches in parallel, ranks results, opens the top pages, and returns a synthesized answer with citations.",
      inputSchema: researchInputSchema,
    },
    async (args) => {
      const response = await runResearch({ ...args, cache });
      return {
        content: [{ type: "text", text: JSON.stringify(response) }],
      };
    },
  );
}
