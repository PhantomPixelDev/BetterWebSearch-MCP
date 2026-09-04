/**
 * `web_find` MCP tool.
 *
 * Site-restricted search. Builds a `site:<domain> <query>` query and runs it
 * through the same aggregate → deduplicate → rerank → slice pipeline as
 * `web_search`, returning the top matches.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { aggregateSearchDetailed } from "../providers/index.js";
import { deduplicate } from "../ranking/deduplicate.js";
import { rerank, type RankedResult } from "../ranking/rerank.js";
import { Cache } from "../utils/cache.js";
import type { SearchSource } from "./search.js";

/** Input schema for `web_find`. */
export const findInputSchema = {
  query: z.string().min(1, "query must not be empty"),
  site: z.string().min(1, "site must not be empty"),
  max_results: z.number().int().min(1).max(20).default(10),
};

/** The spec-shaped `web_find` response. */
export interface FindResponse {
  answer: string;
  sources: SearchSource[];
  queries_used: string[];
  /** Providers that refused or failed, so an empty result reads correctly. */
  warnings?: string[];
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
 * Run a site-restricted search and return the spec-shaped response.
 *
 * Exported separately so tests and the smoke harness can call the handler
 * logic directly.
 */
export async function runFind(args: {
  query: string;
  site: string;
  max_results?: number;
  cache?: Cache;
}): Promise<FindResponse> {
  const query = args.query;
  const site = args.site;
  const maxResults = args.max_results ?? 10;
  const cache = args.cache;

  const siteQuery = `site:${site} ${query}`;
  const cacheKey = `find:${siteQuery}:${maxResults}`;
  const cached = cache?.getSearch(cacheKey);
  if (cached !== null && cached !== undefined) {
    return cached as FindResponse;
  }

  const { results: raw, warnings } = await aggregateSearchDetailed(siteQuery, {
    count: maxResults,
    extraSnippets: true,
  });

  const deduped = deduplicate(raw);
  const ranked = rerank(deduped, query, 30);
  const top = ranked.slice(0, maxResults);

  const response: FindResponse = {
    answer: `Top ${top.length} results from ${site} for "${query}"`,
    sources: top.map(toSource),
    queries_used: [siteQuery],
    ...(warnings.length > 0 ? { warnings } : {}),
  };

  if (warnings.length === 0) {
    cache?.setSearch(cacheKey, siteQuery, response);
  }
  return response;
}

/** Register the `web_find` tool on the given MCP server. */
export function registerFind(server: McpServer, cache?: Cache): void {
  server.registerTool(
    "web_find",
    {
      title: "Web Find",
      description:
        "Search restricted to a single site (e.g. a domain). Builds a `site:<domain> <query>` query and returns the top matching pages with titles, URLs, snippets, and 0-1 relevance scores.",
      inputSchema: findInputSchema,
    },
    async (args) => {
      const response = await runFind({ ...args, cache });
      return {
        content: [{ type: "text", text: JSON.stringify(response) }],
      };
    },
  );
}
