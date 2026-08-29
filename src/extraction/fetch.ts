/**
 * Level-1 HTTP page fetching.
 *
 * Fetches a page with a browser-like user agent, a hard timeout, a
 * content-type guard (HTML only), and a 2MB body cap. Returns the raw HTML
 * plus response metadata so callers can decide how to escalate.
 */

/** Default timeout for a single page fetch, in milliseconds. */
export const DEFAULT_TIMEOUT_MS = 10_000;

/** Maximum number of bytes of body we are willing to read. */
export const MAX_BODY_BYTES = 2 * 1024 * 1024;

/** User agent advertised to servers. */
export const USER_AGENT = "BetterWebSearch-MCP/1.0";

/** Options controlling a single page fetch. */
export interface FetchPageOptions {
  /** Timeout in milliseconds before the request is aborted. Default 10s. */
  timeoutMs?: number;
  /** Extra request headers merged over the defaults. */
  headers?: Record<string, string>;
}

/** The result of a successful page fetch. */
export interface FetchedPage {
  /** The raw HTML body (truncated to {@link MAX_BODY_BYTES}). */
  html: string;
  /** Response headers as a plain record. */
  headers: Record<string, string>;
  /** HTTP status code. */
  status: number;
  /** The final URL after redirects. */
  url: string;
}

/** A fetch that was aborted by the timeout. */
export class FetchTimeoutError extends Error {
  constructor(url: string, timeoutMs: number) {
    super(`Timed out fetching ${url} after ${timeoutMs}ms`);
    this.name = "FetchTimeoutError";
  }
}

/** A fetch that was rejected because the response is not HTML. */
export class NonHtmlError extends Error {
  constructor(url: string, contentType: string) {
    super(`Refusing non-HTML content (${contentType}) at ${url}`);
    this.name = "NonHtmlError";
  }
}

/**
 * Fetch a page as HTML.
 *
 * - Uses native `fetch` with an `AbortController` timeout.
 * - Sends the `BetterWebSearch-MCP/1.0` user agent and follows redirects.
 * - Guards on `content-type`: only `text/html` is accepted; a missing
 *   content-type is allowed through.
 * - Caps the body at {@link MAX_BODY_BYTES} by reading an `arrayBuffer` slice.
 *
 * Throws {@link FetchTimeoutError} on timeout and {@link NonHtmlError} when
 * the content-type is not HTML. Other network errors propagate as-is.
 */
export async function fetchPage(
  url: string,
  opts: FetchPageOptions = {},
): Promise<FetchedPage> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        ...opts.headers,
      },
    });

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType !== "" && !contentType.toLowerCase().includes("text/html")) {
      throw new NonHtmlError(url, contentType);
    }

    const buffer = await response.arrayBuffer();
    const slice = buffer.slice(0, MAX_BODY_BYTES);
    const html = new TextDecoder().decode(slice);

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return { html, headers, status: response.status, url: response.url };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new FetchTimeoutError(url, timeoutMs);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
