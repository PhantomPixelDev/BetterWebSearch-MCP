/**
 * Domain capability profiler.
 *
 * After each extraction the router records what it learned about a domain:
 * whether the page needs JavaScript to render, which framework it runs on,
 * whether it embeds JSON-LD, and which extraction method worked best. The
 * profile is cached per-domain and reused to shortcut the next visit.
 */

/** Frameworks the profiler can recognize from HTML markers. */
export type Framework = "Next.js:Pages" | "Next.js:App" | "Nuxt" | "unknown";

/** The extraction method that worked best for a domain. */
export type BestMethod =
  | "hydration_data"
  | "readability"
  | "browser_api_intercept";

/** A per-domain capability profile. */
export interface DomainProfile {
  /** Whether the page needs JavaScript to produce content. */
  requires_js: boolean;
  /** The framework detected from HTML markers. */
  framework: Framework;
  /** Whether the page embeds JSON-LD structured data. */
  has_json_ld: boolean;
  /** API endpoint patterns discovered for this domain. */
  api_patterns: string[];
  /** The extraction method that worked best on the last visit. */
  best_method: BestMethod;
}

/** The outcome of an extraction, used to build the profile. */
export interface ExtractionResult {
  /** Whether the page embeds JSON-LD structured data. */
  hasJsonLd: boolean;
  /** API endpoint patterns discovered for this domain. */
  apiPatterns: string[];
  /** The extraction method that worked best on this visit. */
  bestMethod: BestMethod;
}

/** Strip HTML tags and collapse whitespace to estimate visible text length. */
function strippedTextLength(html: string): number {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim().length;
}

/**
 * Detect the framework a page runs on from HTML markers.
 *
 * - `__NEXT_DATA__` → Next.js (Pages Router)
 * - `self.__next_f` → Next.js (App Router)
 * - `__NUXT__` → Nuxt
 * - otherwise → unknown
 */
export function detectFramework(html: string): Framework {
  if (html.includes("__NEXT_DATA__")) {
    return "Next.js:Pages";
  }
  if (html.includes("self.__next_f")) {
    return "Next.js:App";
  }
  if (html.includes("__NUXT__")) {
    return "Nuxt";
  }
  return "unknown";
}

/**
 * Build a domain profile from the raw HTML and the outcome of an extraction.
 *
 * `requires_js` is true when the page's visible text (after stripping tags,
 * scripts, and styles) is shorter than 500 characters — a strong signal the
 * content is rendered client-side. `framework` comes from the HTML markers,
 * `has_json_ld` and `api_patterns` from the extraction result, and
 * `best_method` records which extraction strategy worked best. The `domain`
 * argument is kept in the signature for call-site stability and future
 * per-domain merging.
 */
export function profileFor(
  domain: string,
  html: string,
  extractionResult: ExtractionResult,
): DomainProfile {
  return {
    requires_js: strippedTextLength(html) < 500,
    framework: detectFramework(html),
    has_json_ld: extractionResult.hasJsonLd,
    api_patterns: extractionResult.apiPatterns,
    best_method: extractionResult.bestMethod,
  };
}