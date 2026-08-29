/**
 * Content Fusion.
 *
 * Merges the results of several extraction strategies into a single page
 * extraction. Each strategy contributes content plus a confidence score; the
 * fusion picks the highest-confidence content as the primary body while
 * still including every strategy's structured data and API endpoints in the
 * returned object.
 *
 * Confidence baselines (from the spec):
 *   api          0.99
 *   jsonld       0.95
 *   rendered     0.90
 *   readability  0.85
 *   metadata     0.60
 */

import type {
  FusedContent,
  FusionMethod,
  StrategyResult,
} from "./evidence.js";

/** Baseline confidence for each extraction method. */
const METHOD_CONFIDENCE: Record<FusionMethod, number> = {
  api: 0.99,
  jsonld: 0.95,
  rendered: 0.9,
  readability: 0.85,
  metadata: 0.6,
};

/** Whether a method requires a browser render to produce its content. */
const RENDERED_METHODS: ReadonlySet<FusionMethod> = new Set([
  "api",
  "rendered",
]);

/** The default title used when no strategy supplies one. */
const DEFAULT_TITLE = "";

/**
 * Score a strategy result, combining its baseline confidence with any
 * strategy-specific confidence the caller supplied.
 *
 * The effective confidence is the maximum of the method baseline and the
 * strategy's own `confidence` field, so a caller can raise (never lower) a
 * method's baseline.
 */
function effectiveConfidence(result: StrategyResult): number {
  const baseline = METHOD_CONFIDENCE[result.method];
  return Math.max(baseline, result.confidence);
}

/** Whether a strategy produced usable content. */
function hasContent(result: StrategyResult): boolean {
  return result.content.trim().length > 0;
}

/**
 * Merge the structured data from every strategy into a single array.
 *
 * JSON-LD / hydration payloads are collected as an array of objects; the
 * first strategy that contributed structured data wins the primary value,
 * and any additional arrays are appended.
 */
function mergeStructuredData(
  results: readonly StrategyResult[],
): unknown {
  const collected: unknown[] = [];
  for (const result of results) {
    if (result.structured_data === undefined) {
      continue;
    }
    if (Array.isArray(result.structured_data)) {
      collected.push(...result.structured_data);
    } else {
      collected.push(result.structured_data);
    }
  }
  return collected;
}

/**
 * Merge the API endpoint payloads from every strategy into a single array.
 */
function mergeApiEndpoints(
  results: readonly StrategyResult[],
): unknown {
  const collected: unknown[] = [];
  for (const result of results) {
    if (result.api_endpoints === undefined) {
      continue;
    }
    if (Array.isArray(result.api_endpoints)) {
      collected.push(...result.api_endpoints);
    } else {
      collected.push(result.api_endpoints);
    }
  }
  return collected;
}

/**
 * Fuse the results of several extraction strategies into one page extraction.
 *
 * The strategy with the highest effective confidence and non-empty content
 * becomes the primary body. Structured data and API endpoints from every
 * strategy are merged into the returned object regardless of which strategy
 * won the content race.
 *
 * @param url The page URL the strategies were run against.
 * @param title The page title, when known.
 * @param strategiesResults The per-strategy extraction results.
 * @param metadata Page metadata (title, description, published, author,
 *   siteName) to attach to the result.
 */
export function fuseContent(
  url: string,
  title: string,
  strategiesResults: readonly StrategyResult[],
  metadata: Record<string, string> = {},
): FusedContent {
  const usable = strategiesResults.filter(hasContent);

  let winner: StrategyResult | null = null;
  let winnerScore = -1;
  for (const result of usable) {
    const score = effectiveConfidence(result);
    if (score > winnerScore) {
      winner = result;
      winnerScore = score;
    }
  }

  const method: FusionMethod = winner?.method ?? "readability";
  const confidence = winner === null ? 0 : effectiveConfidence(winner);
  const content = winner?.content ?? "";

  return {
    url,
    title: title || DEFAULT_TITLE,
    content,
    extraction: {
      method,
      confidence,
      rendered: RENDERED_METHODS.has(method),
    },
    structured_data: mergeStructuredData(strategiesResults),
    api_endpoints: mergeApiEndpoints(strategiesResults),
    metadata,
  };
}
