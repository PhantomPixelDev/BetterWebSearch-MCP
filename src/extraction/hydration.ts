/**
 * Readable text extraction from hydration payloads.
 *
 * Level 2 of the router handles pages that ship their content as JSON rather
 * than HTML — `__NEXT_DATA__`, Nuxt, Apollo state. It used to use the payload
 * itself as the page content, via `JSON.stringify`, which meant `web_extract`
 * returned the whole hydration blob. Two pages in the benchmark corpus came
 * back at 77KB each, against 4-12KB for pages without hydration, and none of
 * that 77KB was readable: it is braces, quoted keys and escaped markup.
 *
 * It also scored well during passage selection, because a payload repeats every
 * term the article uses, so hydration blobs won citation slots and spent an
 * agent's context on `{"props":{"pageProps":…`.
 *
 * Walking the payload and keeping only prose-shaped strings preserves what the
 * tier exists for while dropping the machinery around it.
 */

/** Cap on the JSON-LD kept in a response, in serialized characters. */
export const MAX_JSONLD_CHARS = 8_000;

/** Shortest string in a payload that could be readable prose. */
const MIN_READABLE_CHARS = 40;

/** Minimum words before a string counts as prose rather than an identifier. */
const MIN_READABLE_WORDS = 5;

/** How deep to walk a payload before giving up. */
const MAX_WALK_DEPTH = 12;

/** Cap on extracted text, so one payload cannot dominate a page. */
export const MAX_HYDRATION_CHARS = 20_000;

/** Strings that are URLs, paths, or encoded blobs rather than content. */
const NOT_PROSE = /^(?:https?:\/\/|data:|\/|#|[A-Za-z0-9+/=]{60,}$)/;

/** Remove tags and decode the few entities that matter, then collapse space. */
export function stripTags(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Whether a string from a payload reads as content. */
export function isReadableString(value: string): boolean {
  if (value.length < MIN_READABLE_CHARS || NOT_PROSE.test(value)) {
    return false;
  }
  // Prose puts spaces between words; slugs, ids and encoded blobs do not.
  return value.split(/\s+/).length >= MIN_READABLE_WORDS;
}

/**
 * Pull the readable text out of a hydration payload.
 *
 * Duplicate strings are dropped, since payloads routinely carry the same
 * summary under several keys, and the total is capped so a single page cannot
 * flood a research response.
 *
 * @param data The parsed hydration payload.
 * @returns Prose found in the payload, joined by blank lines.
 */
export function hydrationText(data: unknown): string {
  const seen = new Set<string>();
  const parts: string[] = [];
  let total = 0;

  const walk = (value: unknown, depth: number): void => {
    if (total >= MAX_HYDRATION_CHARS || depth > MAX_WALK_DEPTH) {
      return;
    }
    if (typeof value === "string") {
      const text = stripTags(value);
      if (isReadableString(text) && !seen.has(text)) {
        seen.add(text);
        parts.push(text);
        total += text.length;
      }
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        walk(item, depth + 1);
      }
      return;
    }
    if (value !== null && typeof value === "object") {
      for (const item of Object.values(value)) {
        walk(item, depth + 1);
      }
    }
  };

  walk(data, 0);
  return parts.join("\n\n");
}

/** What a hydration source contributed, without the payload itself. */
export interface HydrationSummary {
  /** Which hydration containers were present on the page. */
  present: string[];
  /** Characters of readable text recovered from them into the page content. */
  readable_chars: number;
}

/** The structured data a response carries, with payloads summarized away. */
export interface PublishableStructured {
  /** Schema.org entities found on the page, capped in size. */
  jsonLd: unknown[];
  /** What hydration containers held, rather than what they contained. */
  hydration: HydrationSummary;
}

/** The structured-data shape this module summarizes. Kept structural to avoid
 * importing the extractor and creating a cycle. */
interface StructuredLike {
  jsonLd: unknown[];
  nextData?: unknown;
  nextFlight?: string;
  nuxt?: unknown;
  apollo?: unknown;
  initialState?: unknown;
}

/**
 * Reduce extracted structured data to something worth sending to an agent.
 *
 * Fixing the page `content` was only half the problem. The response also
 * carried the raw payload under `structured_data`, so `web_extract` on a
 * Next.js page still shipped about 80KB of `{"props":{"pageProps"…` — the
 * content field was clean while the response was not. A live run through an
 * MCP client is what surfaced it; module-level tests had only ever checked
 * `content`.
 *
 * JSON-LD is kept, since schema.org entities are small and directly useful.
 * Hydration containers are replaced by a note of which were present: their
 * readable text has already been lifted into the page content by
 * {@link hydrationText}, so the payload itself has no remaining consumer.
 */
export function publishableStructured(
  data: StructuredLike | undefined,
  readableChars = 0,
): PublishableStructured | undefined {
  if (data === undefined) {
    return undefined;
  }

  const present: string[] = [];
  if (data.nextData !== undefined) present.push("__NEXT_DATA__");
  if (typeof data.nextFlight === "string" && data.nextFlight !== "") {
    present.push("next_flight");
  }
  if (data.nuxt !== undefined) present.push("__NUXT__");
  if (data.apollo !== undefined) present.push("apollo_state");
  if (data.initialState !== undefined) present.push("initial_state");

  // Cap JSON-LD too: a few pages ship enormous entity graphs, and an agent
  // does not need every node to know what the page is about.
  const jsonLd: unknown[] = [];
  let used = 0;
  for (const entry of data.jsonLd ?? []) {
    const size = JSON.stringify(entry ?? null).length;
    if (used + size > MAX_JSONLD_CHARS) {
      break;
    }
    used += size;
    jsonLd.push(entry);
  }

  return { jsonLd, hydration: { present, readable_chars: readableChars } };
}
