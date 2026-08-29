/**
 * `web_search` MCP tool.
 *
 * Runs a multi-provider search, deduplicates and re-ranks the results, and
 * returns the top N as spec-shaped JSON. Results are cached (15 min TTL) so
 * repeat queries are served from the cache without hitting providers again.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { aggregateSearch } from "../providers/index.js";
import { deduplicate } from "../ranking/deduplicate.js";
import { rerank, type RankedResult } from "../ranking/rerank.js";
import { freshnessFromRecencyDays } from "../providers/brave.js";
import { Cache } from "../utils/cache.js";

/** Input schema for `web_search`. */
export const searchInputSchema = {
  query: z.string().min(1, "query must not be empty"),
  max_results: z.number().int().min(1).max(20).default(10),
  recency_days: z.number().int().min(0).max(365).optional(),
};

/** The spec-shaped source entry returned for each result. */
export interface SearchSource {
  title: string;
  url: string;
  snippet: string;
  published?: string;
  relevance: number;
}

/** The spec-shaped `web_search` response. */
export interface SearchResponse {
  answer: string;
  sources: SearchSource[];
  queries_used: string[];
}

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

/**
 * Run a `web_search` and return the spec-shaped response.
 *
 * Exported separately from the registration so tests and the smoke harness
 * can call the handler logic directly.
 */
export async function runSearch(args: {
  query: string;
  max_results?: number;
  recency_days?: number;
  cache?: Cache;
}): Promise<SearchResponse> {
  const query = args.query;
  const maxResults = args.max_results ?? 10;
  const recencyDays = args.recency_days;
  const cache = args.cache;

  const cacheKey = `search:${query}:${maxResults}:${recencyDays ?? "any"}`;
  const cached = cache?.getSearch(cacheKey);
  if (cached !== null && cached !== undefined) {
    return cached as SearchResponse;
  }

  const freshness = recencyDays === undefined
    ? undefined
    : freshnessFromRecencyDays(recencyDays);

  const raw = await aggregateSearch(query, {
    count: maxResults,
    freshness,
    recency_days: recencyDays,
    extraSnippets: true,
  });

  const deduped = deduplicate(raw);
  const ranked = rerank(deduped, query, recencyDays ?? 30);
  const top = ranked.slice(0, maxResults);

  const response: SearchResponse = {
    answer: `Top ${top.length} results for "${query}"`,
    sources: top.map(toSource),
    queries_used: [query],
  };

  cache?.setSearch(cacheKey, query, response);
  return response;
}

/** Register the `web_search` tool on the given MCP server. */
export function registerSearch(server: McpServer, cache?: Cache): void {
  server.registerTool(
    "web_search",
    {
      title: "Web Search",
      description:
        "Search the web across multiple providers, deduplicate and rank results by relevance, and return the top matches with titles, URLs, snippets, and 0-1 relevance scores.",
      inputSchema: searchInputSchema,
    },
    async (args) => {
      const response = await runSearch({ ...args, cache });
      return {
        content: [{ type: "text", text: JSON.stringify(response) }],
      };
    },
  );
}
