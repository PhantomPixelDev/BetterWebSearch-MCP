import type { SearchResult } from "../providers/types.js";
import { domainScore } from "./domainScore.js";

/** Default recency window (days) when a result has no explicit window. */
const DEFAULT_RECENCY_DAYS = 30;
/** Milliseconds per day. */
const MS_PER_DAY = 86_400_000;

/** A ranked result: the original result plus its computed relevance score. */
export interface RankedResult extends SearchResult {
  /** Combined relevance score in [0, 1]. */
  relevance: number;
}

/**
 * Re-rank search results against a query.
 *
 * Score = 0.5 * termOverlap + 0.2 * domainScore + 0.2 * recencyBoost
 *         + 0.1 * normalizedOriginalScore
 *
 * Pure function: does not mutate the input array. Results are returned
 * sorted by relevance descending.
 */
export function rerank(
  results: readonly SearchResult[],
  query: string,
  recencyDays: number = DEFAULT_RECENCY_DAYS,
): RankedResult[] {
  const queryTerms = tokenize(query);
  const maxOriginalScore = maxScore(results);

  const ranked = results.map((result) => {
    const termOverlap = computeTermOverlap(queryTerms, result);
    const domain = domainScore(result.url);
    const recency = recencyBoost(result.published, recencyDays);
    const original = maxOriginalScore > 0 ? (result.score ?? 0) / maxOriginalScore : 0;

    const relevance =
      0.5 * termOverlap + 0.2 * domain + 0.2 * recency + 0.1 * original;

    return { ...result, relevance };
  });

  return ranked.sort((a, b) => b.relevance - a.relevance);
}

/** Split text into lowercase word tokens. */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length > 0);
}

/** Fraction of query terms present in the title or snippet. */
function computeTermOverlap(queryTerms: string[], result: SearchResult): number {
  if (queryTerms.length === 0) {
    return 0;
  }
  const haystack = new Set([
    ...tokenize(result.title),
    ...tokenize(result.snippet),
  ]);
  let hits = 0;
  for (const term of queryTerms) {
    if (haystack.has(term)) {
      hits += 1;
    }
  }
  return hits / queryTerms.length;
}

/**
 * Recency boost: 1.0 when published within the window, otherwise 0.
 * Results without a parseable date get a neutral 0.5.
 */
function recencyBoost(published: string | undefined, recencyDays: number): number {
  if (published === undefined || published === "") {
    return 0.5;
  }
  const publishedTime = Date.parse(published);
  if (Number.isNaN(publishedTime)) {
    return 0.5;
  }
  const cutoff = Date.now() - recencyDays * MS_PER_DAY;
  return publishedTime >= cutoff ? 1 : 0;
}

/** Highest provider score across results, or 0 when none have one. */
function maxScore(results: readonly SearchResult[]): number {
  let max = 0;
  for (const result of results) {
    const score = result.score ?? 0;
    if (score > max) {
      max = score;
    }
  }
  return max;
}
