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
import type { SearchSource } from "./search.js";

/** Input schema for `web_research`. */
export const researchInputSchema = {
  question: z.string().min(1, "question must not be empty"),
  depth: z.enum(["quick", "deep"]).default("deep"),
  recency_days: z.number().int().min(0).max(365).optional(),
  count_per_query: z.number().int().min(1).max(10).default(5),
};

/** The spec-shaped `web_research` response. */
export interface ResearchResponse {
  answer: string;
  sources: SearchSource[];
  queries_used: string[];
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
function buildAnswer(pages: readonly RoutedPage[]): string {
  if (pages.length === 0) {
    return "No results found";
  }

  const excerpts: string[] = [];
  for (let i = 0; i < pages.length && excerpts.length < MAX_EXCERPTS; i += 1) {
    const page = pages[i];
    if (page === undefined) {
      continue;
    }
    const content = page.content.trim();
    if (content === "") {
      continue;
    }
    const excerpt = content.length > 400 ? `${content.slice(0, 400)}…` : content;
    excerpts.push(`[${i + 1}] ${excerpt}`);
  }

  if (excerpts.length === 0) {
    return "No results found";
  }

  return `Based on ${pages.length} sources:\n\n${excerpts.join("\n\n")}`;
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

  const response: ResearchResponse = {
    answer: buildAnswer(pages),
    sources,
    queries_used: queries,
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
