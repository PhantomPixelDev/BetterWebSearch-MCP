/**
 * API interception during browser rendering.
 *
 * Hooks a Playwright page's `response` events to capture JSON API payloads
 * (XHR / fetch responses) that the page loads while rendering. The captured
 * responses are normalized into `api_patterns` rows via
 * {@link discoverApiPatterns}, so the domain profiler can shortcut the next
 * visit with a direct API call.
 */

/** A single captured JSON API response. */
export interface CapturedApiResponse {
  /** The absolute URL of the API endpoint. */
  url: string;
  /** The HTTP method used to request it. */
  method: string;
  /** The response content-type (e.g. `application/json`). */
  contentType: string;
  /** The parsed JSON body. */
  data: unknown;
}

/** The minimal Playwright `Page` surface this module depends on. */
export interface CapturePage {
  on(event: "response", listener: (response: ApiResponse) => void): unknown;
  off(event: "response", listener: (response: ApiResponse) => void): unknown;
}

/** The minimal Playwright `Response` surface this module depends on. */
export interface ApiResponse {
  url(): string;
  request(): { method(): string };
  headers(): Record<string, string>;
  json(): Promise<unknown>;
}

/** A captured JSON response, before normalization. */
interface RawCapture {
  url: string;
  method: string;
  contentType: string;
  data: unknown;
}

/** Whether a content-type header value denotes a JSON payload. */
function isJsonContentType(contentType: string): boolean {
  return contentType.toLowerCase().includes("application/json");
}

/**
 * Install a JSON API capture listener on a page.
 *
 * Registers a `response` handler that, for every response whose content-type
 * is `application/json`, reads the body and appends `{url, method,
 * contentType, data}` to the returned array. The listener is removed when
 * {@link CapturedApiResponses.remove} is called, so a page can be reused
 * without leaking handlers.
 *
 * @param page The Playwright page to observe.
 * @returns A handle exposing the captured responses and a `remove()` that
 *   detaches the listener.
 */
export function installApiCapture(page: CapturePage): CapturedApiResponses {
  const captured: RawCapture[] = [];

  const listener = async (response: ApiResponse): Promise<void> => {
    const contentType = response.headers()["content-type"] ?? "";
    if (!isJsonContentType(contentType)) {
      return;
    }
    try {
      const data = await response.json();
      captured.push({
        url: response.url(),
        method: response.request().method(),
        contentType,
        data,
      });
    } catch {
      // A JSON content-type that fails to parse is not an API payload we can
      // use; skip it silently rather than crashing the render.
    }
  };

  page.on("response", listener);

  return {
    get captured(): readonly CapturedApiResponse[] {
      return captured;
    },
    remove(): void {
      page.off("response", listener);
    },
  };
}

/** A handle over the responses captured by {@link installApiCapture}. */
export interface CapturedApiResponses {
  /** The responses captured so far, in arrival order. */
  readonly captured: readonly CapturedApiResponse[];
  /** Detach the capture listener from the page. */
  remove(): void;
}

/**
 * Normalize a captured API URL into an `api_patterns` row.
 *
 * The endpoint pattern replaces numeric path segments with `*` so that
 * `/api/products/123` becomes `/api/products/*`. The domain is the URL's
 * hostname. `content_type` is normalized to the bare media type (e.g.
 * `application/json`).
 */
export function discoverApiPatterns(
  domain: string,
  captured: readonly CapturedApiResponse[],
): ApiPatternRow[] {
  const seen = new Set<string>();
  const rows: ApiPatternRow[] = [];

  for (const response of captured) {
    let pathname: string;
    try {
      pathname = new URL(response.url).pathname;
    } catch {
      continue;
    }
    const pattern = normalizePathPattern(pathname);
    const key = `${response.method} ${pattern}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    rows.push({
      domain,
      endpoint_pattern: pattern,
      method: response.method,
      content_type: response.contentType.split(";")[0]?.trim() ?? "application/json",
    });
  }

  return rows;
}

/** An `api_patterns` table row (without the auto-increment id/timestamp). */
export interface ApiPatternRow {
  domain: string;
  endpoint_pattern: string;
  method: string;
  content_type: string;
}

/** Replace numeric path segments with `*` to form a reusable pattern. */
function normalizePathPattern(pathname: string): string {
  const segments = pathname.split("/").map((segment) => {
    if (segment === "") {
      return segment;
    }
    return /^\d+$/.test(segment) ? "*" : segment;
  });
  return segments.join("/");
}
