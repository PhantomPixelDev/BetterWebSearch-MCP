/**
 * Structured / hydration data extraction.
 *
 * Pulls hidden JSON payloads that modern frameworks embed in the page:
 * JSON-LD, Next.js `__NEXT_DATA__` and `self.__next_f.push` flight chunks,
 * and Nuxt / Apollo / Redux initial-state globals. Every extractor is
 * defensive: malformed JSON is skipped silently, never thrown.
 */

import * as cheerio from "cheerio";

/** The result of a structured-data extraction. */
export interface StructuredData {
  /** Parsed JSON-LD objects (with `@graph` unwrapped into its members). */
  jsonLd: unknown[];
  /** Parsed `#__NEXT_DATA__` payload, when present. */
  nextData: unknown;
  /** Concatenated `self.__next_f.push` flight chunks, when present. */
  nextFlight: string;
  /** Parsed `window.__NUXT__` payload, when present. */
  nuxt: unknown;
  /** Parsed `window.__APOLLO_STATE__` payload, when present. */
  apollo: unknown;
  /** Parsed `window.__INITIAL_STATE__` payload, when present. */
  initialState: unknown;
}

/** An empty structured-data result, used when nothing is found. */
export const EMPTY_STRUCTURED: StructuredData = {
  jsonLd: [],
  nextData: undefined,
  nextFlight: "",
  nuxt: undefined,
  apollo: undefined,
  initialState: undefined,
};

/** Parse JSON, returning `undefined` on any malformed input. */
function tryParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

/**
 * Unwrap a JSON-LD value into a flat list of objects.
 *
 * A single object becomes a one-element list; an array is spread; an object
 * with an `@graph` array is unwrapped into its members.
 */
function unwrapJsonLd(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (value !== null && typeof value === "object") {
    const graph = (value as Record<string, unknown>)[
      "@graph"
    ] as unknown[] | undefined;
    if (Array.isArray(graph)) {
      return graph;
    }
    return [value];
  }
  return [];
}

/** Collect and parse every `application/ld+json` script block. */
function extractJsonLd($: cheerio.CheerioAPI): unknown[] {
  const collected: unknown[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).text().trim();
    if (raw === "") {
      return;
    }
    const parsed = tryParse(raw);
    if (parsed === undefined) {
      return;
    }
    collected.push(...unwrapJsonLd(parsed));
  });
  return collected;
}

/** Parse the `#__NEXT_DATA__` script payload, if present. */
function extractNextData($: cheerio.CheerioAPI): unknown {
  const raw = $("#__NEXT_DATA__").text().trim();
  if (raw === "") {
    return undefined;
  }
  return tryParse(raw);
}

/**
 * Concatenate the string payloads of every `self.__next_f.push(...)` call.
 *
 * Next.js App Router embeds flight data as a series of
 * `self.__next_f.push([1,"..."])` calls inside inline scripts. We match each
 * call and join the first string argument of every chunk.
 */
function extractNextFlight(html: string): string {
  const chunks: string[] = [];
  const pushRe = /self\.__next_f\.push\(\s*\[[^\]]*,\s*"((?:\\.|[^"\\])*)"\s*\]\s*\)/g;
  let match: RegExpExecArray | null;
  while ((match = pushRe.exec(html)) !== null) {
    const raw = match[1] ?? "";
    chunks.push(decodeJsString(raw));
  }
  return chunks.join("");
}

/** Decode a JS string literal body (handles `\n`, `\"`, `\\`, `\uXXXX`). */
function decodeJsString(raw: string): string {
  return raw
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\")
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) =>
      String.fromCharCode(parseInt(hex, 16)),
    );
}

/**
 * Extract a `window.NAME = {...};` object literal by matching balanced braces.
 *
 * Returns the parsed object, or `undefined` when the assignment is absent or
 * the payload is malformed.
 */
function extractWindowObject(html: string, name: string): unknown {
  const re = new RegExp(`window\\.${name}\\s*=\\s*(\\{)`, "g");
  const match = re.exec(html);
  if (match === null) {
    return undefined;
  }

  const start = match.index + (match[1] ? match[1].length : 0);
  const openIndex = html.indexOf("{", match.index);
  if (openIndex === -1) {
    return undefined;
  }

  let depth = 0;
  let inString = false;
  let quote = "";
  let escaped = false;
  for (let i = openIndex; i < html.length; i++) {
    const ch = html[i] as string;
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === quote) {
        inString = false;
      }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inString = true;
      quote = ch;
      continue;
    }
    if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        const body = html.slice(openIndex, i + 1);
        return tryParse(body);
      }
    }
  }
  return undefined;
}

/**
 * Extract all structured / hydration data from an HTML page.
 *
 * Every extractor is defensive: malformed JSON-LD, broken `__NEXT_DATA__`,
 * or truncated window globals are skipped silently rather than thrown.
 */
export function extractStructuredData(html: string): StructuredData {
  const $ = cheerio.load(html);

  return {
    jsonLd: extractJsonLd($),
    nextData: extractNextData($),
    nextFlight: extractNextFlight(html),
    nuxt: extractWindowObject(html, "__NUXT__"),
    apollo: extractWindowObject(html, "__APOLLO_STATE__"),
    initialState: extractWindowObject(html, "__INITIAL_STATE__"),
  };
}
