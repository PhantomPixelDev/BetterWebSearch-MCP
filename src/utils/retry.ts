/**
 * Retry helper for transient HTTP failures (rate limits, server overload).
 *
 * Providers wrap their `fetch` call in {@link withRetry} so that 429 (Too
 * Many Requests) and 503 (Service Unavailable) responses — plus network
 * errors that carry a `status` — are retried with exponential backoff and
 * jitter. The `Retry-After` header, when present, is honored as the delay
 * before the next attempt.
 */

/** Options controlling {@link withRetry}. */
export interface RetryOptions {
  /** Maximum number of retries after the initial attempt (default 2). */
  maxRetries?: number;
  /** Base delay in ms for the first retry (default 200). */
  baseMs?: number;
  /** HTTP status codes that trigger a retry (default [429, 503]). */
  retryOn?: number[];
  /** Also retry thrown errors that carry no HTTP status (network errors). */
  retryNetworkErrors?: boolean;
}

/** A value that may carry an HTTP status (a Response or a thrown error). */
interface StatusCarrier {
  status?: number;
  headers?: {
    get(name: string): string | null;
  };
}

/** Default status codes that are safe to retry. */
const DEFAULT_RETRY_ON = [429, 503];

/** Default base delay in milliseconds. */
const DEFAULT_BASE_MS = 200;

/** Default maximum number of retries. */
const DEFAULT_MAX_RETRIES = 2;

/** Upper bound on jitter so tests stay deterministic-ish and fast. */
const JITTER_MAX_MS = 50;

/**
 * Parse a `Retry-After` header value into a delay in milliseconds.
 *
 * The header is either a number of seconds or an HTTP-date. Returns
 * `undefined` when the value is absent or unparseable.
 */
export function parseRetryAfter(value: string | null | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed === "") {
    return undefined;
  }
  // Seconds form: a bare integer.
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed) * 1000;
  }
  // HTTP-date form.
  const date = Date.parse(trimmed);
  if (Number.isNaN(date)) {
    return undefined;
  }
  const delay = date - Date.now();
  return delay > 0 ? delay : 0;
}

/**
 * Run `fn`, retrying on transient failures with exponential backoff.
 *
 * A failure is retryable when the returned value (or thrown error) carries a
 * `status` in `opts.retryOn`. When the carrier exposes a `Retry-After`
 * header, that delay is used instead of the computed backoff. After
 * `maxRetries` retries the last failure is returned/thrown as-is — callers
 * decide how to degrade (providers return `[]`).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const maxRetries = opts.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseMs = opts.baseMs ?? DEFAULT_BASE_MS;
  const retryOn = opts.retryOn ?? DEFAULT_RETRY_ON;
  const retryNetworkErrors = opts.retryNetworkErrors ?? false;

  let attempt = 0;
  for (;;) {
    let result: T;
    try {
      result = await fn();
    } catch (error) {
      const carrier = error as StatusCarrier;
      if (
        attempt >= maxRetries ||
        !isRetryable(carrier, retryOn, retryNetworkErrors)
      ) {
        throw error;
      }
      const delay = delayFor(carrier, baseMs, attempt);
      console.warn(
        `[retry] attempt ${attempt + 1} failed (${describeStatus(carrier)}); retrying in ${delay}ms`,
      );
      await sleep(delay);
      attempt += 1;
      continue;
    }

    const carrier = result as StatusCarrier;
    if (attempt >= maxRetries || !isRetryable(carrier, retryOn, false)) {
      return result;
    }
    const delay = delayFor(carrier, baseMs, attempt);
    console.warn(
      `[retry] attempt ${attempt + 1} returned ${describeStatus(carrier)}; retrying in ${delay}ms`,
    );
    await sleep(delay);
    attempt += 1;
  }
}

/** Whether a carrier's status is retryable, or it is a network error. */
function isRetryable(
  carrier: StatusCarrier,
  retryOn: number[],
  retryNetworkErrors: boolean,
): boolean {
  if (carrier.status !== undefined) {
    return retryOn.includes(carrier.status);
  }
  return retryNetworkErrors;
}

/** Compute the delay for the next attempt, honoring Retry-After. */
function delayFor(carrier: StatusCarrier, baseMs: number, attempt: number): number {
  const retryAfter = parseRetryAfter(carrier.headers?.get("retry-after"));
  if (retryAfter !== undefined) {
    return retryAfter;
  }
  // Exponential backoff with jitter: baseMs * 2^attempt + random jitter.
  const backoff = baseMs * 2 ** attempt;
  const jitter = Math.floor(Math.random() * JITTER_MAX_MS);
  return backoff + jitter;
}

/** A short human-readable description of a carrier for log messages. */
function describeStatus(carrier: StatusCarrier): string {
  if (carrier.status !== undefined) {
    return `status ${carrier.status}`;
  }
  return "error";
}

/** Promise-based sleep. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
