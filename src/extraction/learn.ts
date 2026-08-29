/**
 * Post-extraction learning: domain profiling and API-pattern discovery.
 *
 * After the router completes an extraction it records what it learned about
 * the domain — which framework it runs on, whether it embeds JSON-LD, and
 * which extraction method worked best — plus any API endpoint patterns
 * captured during a browser render. This lets the next visit to the same
 * domain be shortcut.
 */

import { Cache } from "../utils/cache.js";
import { profileFor, type BestMethod } from "../utils/domainProfile.js";
import { extractStructuredData } from "./structured.js";
import {
  discoverApiPatterns,
  type CapturedApiResponse,
} from "./apiIntercept.js";
import type { RouterMethod } from "./router.js";

/** Map a router method to the domain-profile `best_method` value. */
export function toBestMethod(method: RouterMethod): BestMethod {
  switch (method) {
    case "http_fetch":
      return "readability";
    case "hydration_data":
      return "hydration_data";
    case "browser_api_intercept":
    case "rendered_dom":
      return "browser_api_intercept";
  }
}

/** Update the domain profile after a successful extraction. */
export function updateDomainProfile(
  url: string,
  html: string,
  method: RouterMethod,
  cache: Cache | undefined,
): void {
  if (cache === undefined) {
    return;
  }
  let domain: string;
  try {
    domain = new URL(url).hostname;
  } catch {
    return;
  }
  const structured = extractStructuredData(html);
  const profile = profileFor(domain, html, {
    hasJsonLd: structured.jsonLd.length > 0,
    apiPatterns: [],
    bestMethod: toBestMethod(method),
  });
  cache.setDomain(domain, profile);
}

/** Record discovered API patterns for a domain after a browser render. */
export function recordApiPatterns(
  url: string,
  captured: readonly CapturedApiResponse[],
  cache: Cache | undefined,
): void {
  if (cache === undefined || captured.length === 0) {
    return;
  }
  let domain: string;
  try {
    domain = new URL(url).hostname;
  } catch {
    return;
  }
  for (const pattern of discoverApiPatterns(domain, captured)) {
    cache.addApiPattern(
      domain,
      pattern.endpoint_pattern,
      pattern.method,
      pattern.content_type,
    );
  }
}
