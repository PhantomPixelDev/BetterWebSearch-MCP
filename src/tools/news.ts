/**
 * `web_news` MCP tool.
 *
 * Recency-filtered news search. Runs a search with a tight freshness window,
 * post-filters results by their published date, ensures domain diversity, and
 * groups the results into a timeline keyed by publication date.
 *
 * Publication dates come from Brave and Tavily. DuckDuckGo's HTML endpoint
 * supplies none, so requiring a date made this tool return an empty list for
 * every topic on the keyless path, which reads exactly like "no news exists".
 * When no result is dated the search still returns its topical matches and
 * sets `recency_verified` to false, so a caller can tell the difference.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { aggregateSearchDetailed } from "../providers/index.js";
import { deduplicate } from "../ranking/deduplicate.js";
import { rerank, type RankedResult } from "../ranking/rerank.js";
import { freshnessFromRecencyDays } from "../providers/brave.js";
import { Cache } from "../utils/cache.js";
import type { SearchSource } from "./search.js";

/** Input schema for `web_news`. */
export const newsInputSchema = {
  topic: z.string().min(1, "topic must not be empty"),
  recency_days: z.number().int().min(1).max(365).default(7),
  max_results: z.number().int().min(1).max(20).default(10),
};

/** The spec-shaped `web_news` response. */
export interface NewsResponse {
  answer: string;
  sources: SearchSource[];
  timeline: Record<string, SearchSource[]>;
  queries_used: string[];
  /** Providers that refused or failed, so an empty result reads correctly. */
  warnings?: string[];
  /**
   * Whether every returned source carried a publication date inside the
   * requested window.
   *
   * False means the results are topical but their age is unknown, which
   * happens on the keyless path: DuckDuckGo's HTML endpoint does not supply
   * dates. An agent should not describe those as "from the last N days".
   */
  recency_verified: boolean;
}

/** Milliseconds per day. */
const MS_PER_DAY = 86_400_000;

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
    return false;
  }
  const time = Date.parse(published);
  if (Number.isNaN(time)) {
    return false;
  }
  return time >= Date.now() - recencyDays * MS_PER_DAY;
}

/** Group sources into a timeline keyed by their publication date (YYYY-MM-DD). */
function buildTimeline(sources: readonly SearchSource[]): Record<string, SearchSource[]> {
  const timeline: Record<string, SearchSource[]> = {};
  for (const source of sources) {
    if (source.published === undefined || source.published === "") {
      continue;
    }
    const day = source.published.slice(0, 10);
    const bucket = timeline[day];
    if (bucket === undefined) {
      timeline[day] = [source];
    } else {
      bucket.push(source);
    }
  }
  return timeline;
}

/**
 * Run a recency-filtered news search and return the spec-shaped response.
 *
 * Exported separately so tests and the smoke harness can call the handler
 * logic directly.
 */
export async function runNews(args: {
  topic: string;
  recency_days?: number;
  max_results?: number;
  cache?: Cache;
}): Promise<NewsResponse> {
  const topic = args.topic;
  const recencyDays = args.recency_days ?? 7;
  const maxResults = args.max_results ?? 10;
  const cache = args.cache;

  const cacheKey = `news:${topic}:${recencyDays}:${maxResults}`;
  const cached = cache?.getSearch(cacheKey);
  if (cached !== null && cached !== undefined) {
    return cached as NewsResponse;
  }

  const freshness = freshnessFromRecencyDays(recencyDays);
  const { results: raw, warnings } = await aggregateSearchDetailed(topic, {
    count: maxResults * 3,
    freshness,
    recency_days: recencyDays,
    extraSnippets: true,
  });

  const deduped = deduplicate(raw);
  const ranked = rerank(deduped, topic, recencyDays);

  // Post-filter by published date within the recency window.
  const dated = ranked.filter((r) => withinWindow(r.published, recencyDays));

  // Falling back to undated results rather than returning nothing. The only
  // keyless provider does not supply publication dates, so requiring one made
  // web_news return an empty list for every topic — indistinguishable from
  // "no news exists". Recency is reported as unverified instead of silently
  // claiming a window the data cannot support.
  const recencyVerified = dated.length > 0;
  const recent = recencyVerified
    ? dated
    : ranked.filter((r) => r.published === undefined || r.published === "");

  // Ensure domain diversity: keep at most one result per host, in rank order.
  const seenHosts = new Set<string>();
  const diverse: RankedResult[] = [];
  for (const result of recent) {
    let host: string;
    try {
      host = new URL(result.url).hostname;
    } catch {
      host = result.url;
    }
    if (seenHosts.has(host)) {
      continue;
    }
    seenHosts.add(host);
    diverse.push(result);
    if (diverse.length >= maxResults) {
      break;
    }
  }

  const sources = diverse.map(toSource);

  const notes = [...warnings];
  if (!recencyVerified && sources.length > 0) {
    notes.push(
      `No result carried a publication date, so recency could not be verified. ` +
        `DuckDuckGo does not supply dates; set BRAVE_API_KEY or TAVILY_API_KEY ` +
        `for date-filtered news. Showing ${sources.length} undated results for the topic.`,
    );
  }

  const response: NewsResponse = {
    answer: recencyVerified
      ? `Top ${sources.length} recent news results for "${topic}" within ${recencyDays} days`
      : `Top ${sources.length} results for "${topic}" (publication dates unavailable, recency unverified)`,
    sources,
    timeline: buildTimeline(sources),
    queries_used: [topic],
    recency_verified: recencyVerified,
    ...(notes.length > 0 ? { warnings: notes } : {}),
  };

  if (warnings.length === 0) {
    cache?.setSearch(cacheKey, topic, response);
  }
  return response;
}

/** Register the `web_news` tool on the given MCP server. */
export function registerNews(server: McpServer, cache?: Cache): void {
  server.registerTool(
    "web_news",
    {
      title: "Web News",
      description:
        "Search for recent news on a topic within a recency window. Results are filtered by publication date, deduplicated across domains for diversity, and grouped into a timeline keyed by publication date. Check `recency_verified`: publication dates require BRAVE_API_KEY or TAVILY_API_KEY, and on the keyless path it is false, meaning the results match the topic but their age is unknown and must not be described as recent.",
      inputSchema: newsInputSchema,
    },
    async (args) => {
      const response = await runNews({ ...args, cache });
      return {
        content: [{ type: "text", text: JSON.stringify(response) }],
      };
    },
  );
}
