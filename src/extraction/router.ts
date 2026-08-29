/**
 * AccessRouter escalation.
 *
 * Implements the three-tier page extraction pipeline:
 *
 *   Level 1  HTTP fetch → readability (fast, no browser)
 *   Level 2  Structured / hydration data (JSON-LD, __NEXT_DATA__, ...)
 *   Level 3  Browser render + API interception (only when needed)
 *
 * A page-cache hit short-circuits the whole pipeline. After each successful
 * extraction the domain profile is updated and any discovered API patterns
 * are recorded, so the next visit to the same domain can be shortcut.
 *
 * Dependencies (cache, browser pool, extractors) are injectable so tests can
 * mock the network and browser without global mocking.
 */

import { fetchPage, type FetchedPage } from "./fetch.js";
import {
  extractWithReadability,
  type ReadabilityResult,
} from "./readability.js";
import { extractMetadata, type PageMetadata } from "./metadata.js";
import {
  extractStructuredData,
  type StructuredData,
} from "./structured.js";
import { BrowserPool } from "./browser.js";
import { Cache } from "../utils/cache.js";
import { recordApiPatterns, updateDomainProfile } from "./learn.js";
import type { Evidence } from "./evidence.js";

/** The extraction method chosen by the router. */
export type RouterMethod =
  | "http_fetch"
  | "hydration_data"
  | "browser_api_intercept"
  | "rendered_dom";

/** The page extraction returned by {@link getPage}. */
export interface RoutedPage {
  /** The page URL. */
  url: string;
  /** The page title. */
  title: string;
  /** The extracted content (Markdown or plain text). */
  content: string;
  /** Metadata about the winning extraction method. */
  extraction: {
    /** The method that produced the content. */
    method: RouterMethod;
    /** Confidence in the content, 0..1. */
    confidence: number;
    /** Whether a browser render was required. */
    rendered: boolean;
  };
  /** Structured data (JSON-LD / hydration) found on the page. */
  structured_data: unknown;
  /** API endpoint payloads captured during a browser render. */
  api_endpoints: unknown;
  /** Page metadata (title, description, published, author, siteName). */
  metadata: PageMetadata;
  /** Alternative-source evidence appended when the primary extraction was blocked. */
  evidence?: Evidence[];
}

/** Options controlling the escalation pipeline. */
export interface GetPageOptions {
  /** `auto` escalates; `fast` skips the browser; `browser` forces it. */
  mode?: "auto" | "fast" | "browser";
  /** Whether to include API data captured during a browser render. */
  include_api_data?: boolean;
  /** Whether to attempt structured / hydration data extraction. */
  include_structured_data?: boolean;
  /** Whether to fall back to a browser render when HTTP is insufficient. */
  browser_fallback?: boolean;
}

/** Injectable dependencies, defaulting to the real modules. */
export interface RouterDeps {
  cache?: Cache;
  browserPool?: BrowserPool;
  fetchPage?: typeof fetchPage;
  extractWithReadability?: typeof extractWithReadability;
  extractStructuredData?: typeof extractStructuredData;
  extractMetadata?: typeof extractMetadata;
}

/** Minimum visible-text length (after stripping tags) for Level 1 to win. */
export const ENOUGH_CONTENT_LENGTH = 500;

/** Minimum structured-content length for Level 2 to win. */
export const STRUCTURED_CONTENT_LENGTH = 200;

/** Confidence baselines per extraction tier (Level 1..3 + best-effort). */
export const HTTP_FETCH_CONFIDENCE = 0.85;
export const HYDRATION_CONFIDENCE = 0.9;
export const HYDRATION_PRODUCT_CONFIDENCE = 0.95;
export const BROWSER_API_CONFIDENCE = 0.96;
export const RENDERED_DOM_CONFIDENCE = 0.9;
export const BEST_EFFORT_CONFIDENCE = 0.5;

function strippedText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Whether a page has enough visible text to be useful without a browser. */
export function hasEnoughContent(html: string): boolean {
  return strippedText(html).length > ENOUGH_CONTENT_LENGTH;
}

function normalizeOptions(opts: GetPageOptions): Required<GetPageOptions> {
  const mode = opts.mode ?? "auto";
  const forcedBrowser = mode === "browser";
  const skipBrowser = mode === "fast";
  return {
    mode,
    include_api_data: opts.include_api_data ?? true,
    include_structured_data: opts.include_structured_data ?? true,
    browser_fallback: forcedBrowser
      ? true
      : skipBrowser
        ? false
        : (opts.browser_fallback ?? true),
  };
}

/** Resolved dependencies: functions defaulted, optional seams kept optional. */
type ResolvedDeps = Omit<Required<RouterDeps>, "cache" | "browserPool"> &
  Pick<RouterDeps, "cache" | "browserPool">;

function resolveDeps(deps: RouterDeps): ResolvedDeps {
  return {
    cache: deps.cache,
    browserPool: deps.browserPool,
    fetchPage: deps.fetchPage ?? fetchPage,
    extractWithReadability:
      deps.extractWithReadability ?? extractWithReadability,
    extractStructuredData:
      deps.extractStructuredData ?? extractStructuredData,
    extractMetadata: deps.extractMetadata ?? extractMetadata,
  };
}

function structuredContent(structured: StructuredData): string {
  const parts: string[] = [];
  for (const entry of structured.jsonLd) {
    if (entry === null || typeof entry !== "object") {
      continue;
    }
    const rec = entry as Record<string, unknown>;
    for (const key of ["articleBody", "description", "headline", "name"]) {
      const value = rec[key];
      if (typeof value === "string" && value.trim() !== "") {
        parts.push(value.trim());
      }
    }
  }
  if (structured.nextData !== undefined) {
    parts.push(JSON.stringify(structured.nextData));
  }
  return parts.join("\n\n");
}

function isProductStructured(structured: StructuredData): boolean {
  return structured.jsonLd.some((entry) => {
    if (entry === null || typeof entry !== "object") {
      return false;
    }
    const type = (entry as Record<string, unknown>)["@type"];
    return type === "Product" || (Array.isArray(type) && type.includes("Product"));
  });
}

function bestEffort(
  url: string,
  html: string,
  metadata: PageMetadata,
  deps: ResolvedDeps,
): RoutedPage {
  const readability = html === "" ? null : deps.extractWithReadability(html, url);
  const content = readability?.contentMarkdown ?? strippedText(html);
  return {
    url,
    title: readability?.title ?? metadata.title,
    content,
    extraction: {
      method: "http_fetch",
      confidence: BEST_EFFORT_CONFIDENCE,
      rendered: false,
    },
    structured_data: html === "" ? undefined : deps.extractStructuredData(html),
    api_endpoints: undefined,
    metadata,
  };
}

/** Whether a fetch outcome counts as blocked (failed or 401/403/429). */
function isBlockedFetch(fetched: FetchedPage | null): boolean {
  return (
    fetched === null ||
    fetched.status === 401 ||
    fetched.status === 403 ||
    fetched.status === 429
  );
}

/**
 * Append alternative-source evidence when the primary extraction is
 * low-confidence or the page was blocked. The alternative module is imported
 * lazily to avoid a static import cycle.
 */
async function appendAlternativeEvidence(
  result: RoutedPage,
  fetched: FetchedPage | null,
  cache: Cache | undefined,
): Promise<RoutedPage> {
  if (result.extraction.confidence >= 0.5 && !isBlockedFetch(fetched)) {
    return result;
  }
  const { findAlternativeSources } = await import("./alternative.js");
  const evidence = await findAlternativeSources(
    result.url,
    result.title || null,
    { cache },
  );
  if (evidence.length === 0) {
    return result;
  }
  const note =
    "> Note: primary extraction blocked or low-confidence; alternative source evidence appended.";
  const snippet = evidence[0]?.snippet ?? "";
  return {
    ...result,
    evidence,
    content: snippet === "" ? result.content : `${note}\n\n${snippet}`,
  };
}

/**
 * Fetch and extract a page, escalating through the three tiers as needed.
 *
 * @param url The page URL to extract.
 * @param opts Escalation options (mode, include flags, browser fallback).
 * @param deps Injectable dependencies for testing.
 */
export async function getPage(
  url: string,
  opts: GetPageOptions = {},
  deps: RouterDeps = {},
): Promise<RoutedPage> {
  const options = normalizeOptions(opts);
  const d = resolveDeps(deps);

  // Cache hit short-circuits the entire pipeline.
  if (d.cache !== undefined) {
    const cached = d.cache.getPage(url);
    if (cached !== null) {
      return {
        url,
        title: "",
        content: cached.content,
        extraction: {
          method: cached.extraction_method as RouterMethod,
          confidence: cached.confidence,
          rendered: false,
        },
        structured_data: undefined,
        api_endpoints: undefined,
        metadata: {
          title: "",
          description: "",
          published: "",
          author: "",
          siteName: "",
        },
      };
    }
  }

  // Level 1: HTTP fetch.
  let fetched: FetchedPage | null = null;
  try {
    fetched = await d.fetchPage(url);
  } catch {
    fetched = null;
  }
  const html = fetched?.html ?? "";
  const metadata = d.extractMetadata(html);

  // Force-browser mode skips straight to Level 3.
  if (options.mode !== "browser" && fetched !== null && hasEnoughContent(html)) {
    const readability = d.extractWithReadability(html, url);
    if (readability !== null) {
      const result: RoutedPage = {
        url,
        title: readability.title || metadata.title,
        content: readability.contentMarkdown,
        extraction: {
          method: "http_fetch",
          confidence: HTTP_FETCH_CONFIDENCE,
          rendered: false,
        },
        structured_data: undefined,
        api_endpoints: undefined,
        metadata,
      };
      d.cache?.setPage(url, result.content, "http_fetch", HTTP_FETCH_CONFIDENCE);
      updateDomainProfile(url, html, "http_fetch", d.cache);
      return result;
    }
  }

  // Level 2: structured / hydration data.
  if (options.include_structured_data && html !== "") {
    const structured = d.extractStructuredData(html);
    const content = structuredContent(structured);
    if (content.length > STRUCTURED_CONTENT_LENGTH) {
      const confidence = isProductStructured(structured)
        ? HYDRATION_PRODUCT_CONFIDENCE
        : HYDRATION_CONFIDENCE;
      const result: RoutedPage = {
        url,
        title: metadata.title,
        content,
        extraction: {
          method: "hydration_data",
          confidence,
          rendered: false,
        },
        structured_data: structured,
        api_endpoints: undefined,
        metadata,
      };
      d.cache?.setPage(url, result.content, "hydration_data", confidence);
      updateDomainProfile(url, html, "hydration_data", d.cache);
      return result;
    }
  }

  // Level 3: browser render + API interception.
  if (options.browser_fallback && d.browserPool !== undefined) {
    try {
      const render = await d.browserPool.renderWithBrowser(url);
      const renderedHtml = render.html;
      const captured = render.captured;
      const renderedMetadata = d.extractMetadata(renderedHtml);
      const readability = d.extractWithReadability(renderedHtml, url);
      const content =
        readability?.contentMarkdown ?? strippedText(renderedHtml);
      const hasApi = options.include_api_data && captured.length > 0;
      const method: RouterMethod = hasApi
        ? "browser_api_intercept"
        : "rendered_dom";
      const confidence = hasApi
        ? BROWSER_API_CONFIDENCE
        : RENDERED_DOM_CONFIDENCE;
      const result: RoutedPage = {
        url,
        title: readability?.title ?? renderedMetadata.title,
        content,
        extraction: { method, confidence, rendered: true },
        structured_data: d.extractStructuredData(renderedHtml),
        api_endpoints: hasApi ? captured : undefined,
        metadata: renderedMetadata,
      };
      d.cache?.setPage(url, result.content, method, confidence);
      updateDomainProfile(url, renderedHtml, method, d.cache);
      recordApiPatterns(url, captured, d.cache);
      return result;
    } catch {
      // Browser failed; fall through to best-effort.
    }
  }

  // Best-effort fallback.
  const result = bestEffort(url, html, metadata, d);
  return appendAlternativeEvidence(result, fetched, d.cache);
}
