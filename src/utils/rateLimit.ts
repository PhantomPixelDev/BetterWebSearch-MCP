/**
 * Per-provider request pacing and cooldown.
 *
 * `web_research` expands a question into several queries and runs them in
 * parallel across every provider, so a single call could fire three or more
 * requests at one endpoint within milliseconds. DuckDuckGo answers that with a
 * challenge page, and the tool then reports an empty search. Reporting it
 * accurately was the previous fix; not provoking it is this one.
 *
 * Two mechanisms, both deterministic:
 *
 *   pacing    requests to one provider are spaced by a minimum interval, so
 *             parallel callers queue rather than burst
 *   cooldown  once a provider refuses, further requests fail immediately for
 *             a while instead of hammering an endpoint that is already
 *             turning us away
 *
 * The first request through a fresh limiter never waits, so a single search is
 * as fast as it ever was; only a burst pays the interval.
 */

/** Default spacing between requests to one provider, in milliseconds. */
export const DEFAULT_INTERVAL_MS = 1_000;

/** How long a provider is skipped after refusing, in milliseconds. */
export const DEFAULT_COOLDOWN_MS = 60_000;

/** A provider was asked for something while it is cooling down. */
export class CoolingDownError extends Error {
  /** Milliseconds remaining before the provider is tried again. */
  readonly remainingMs: number;

  constructor(name: string, remainingMs: number) {
    super(
      `${name} is cooling down for another ${Math.ceil(remainingMs / 1000)}s after refusing a request`,
    );
    this.name = "CoolingDownError";
    this.remainingMs = remainingMs;
  }
}

/** Promise-based sleep. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Serializes work for one provider, spacing it and honouring a cooldown.
 *
 * Scheduling is a chain rather than a timestamp check: concurrent callers each
 * await the previous one, so N parallel requests are spread across N intervals
 * instead of all seeing the same "last call" time and going at once.
 */
export class RateLimiter {
  /** Provider name, used in error messages. */
  readonly name: string;

  /** Minimum spacing between requests, in milliseconds. */
  private intervalMs: number;

  /** Tail of the queue: resolves when the previous caller may proceed. */
  private chain: Promise<void> = Promise.resolve();

  /** Epoch milliseconds until which requests are refused outright. */
  private cooldownUntil = 0;

  constructor(name: string, intervalMs: number = DEFAULT_INTERVAL_MS) {
    this.name = name;
    this.intervalMs = intervalMs;
  }

  /** Change the spacing. Used by configuration and by tests. */
  setInterval(intervalMs: number): void {
    this.intervalMs = Math.max(0, intervalMs);
  }

  /** Whether this provider is currently refusing work. */
  isCoolingDown(now: number = Date.now()): boolean {
    return now < this.cooldownUntil;
  }

  /** Milliseconds until the cooldown lifts, or 0 if it is not active. */
  cooldownRemaining(now: number = Date.now()): number {
    return Math.max(0, this.cooldownUntil - now);
  }

  /**
   * Stop sending requests for a while.
   *
   * @param ms How long to wait. Callers pass a `Retry-After` value when the
   * provider supplied one, so an explicit instruction is preferred over the
   * default guess.
   */
  startCooldown(ms: number = DEFAULT_COOLDOWN_MS, now: number = Date.now()): void {
    const until = now + Math.max(0, ms);
    // Never shorten an existing cooldown: a second refusal during one means
    // the provider is still unhappy.
    this.cooldownUntil = Math.max(this.cooldownUntil, until);
  }

  /** Clear the cooldown, used when a request succeeds again. */
  clearCooldown(): void {
    this.cooldownUntil = 0;
  }

  /**
   * Run `fn` once the provider is due another request.
   *
   * Throws {@link CoolingDownError} without running `fn` if the provider is in
   * a cooldown, so a blocked provider costs nothing rather than a timeout.
   */
  async schedule<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isCoolingDown()) {
      throw new CoolingDownError(this.name, this.cooldownRemaining());
    }

    const previous = this.chain;
    let release: () => void = () => {};
    this.chain = new Promise<void>((resolve) => {
      release = resolve;
    });

    await previous;
    // Re-check: the queue may have been waiting while a cooldown began.
    if (this.isCoolingDown()) {
      release();
      throw new CoolingDownError(this.name, this.cooldownRemaining());
    }

    try {
      return await fn();
    } finally {
      // Hold the slot for the interval so the next caller is spaced out, then
      // let it through. Detached so this call returns as soon as it is done.
      if (this.intervalMs > 0) {
        void sleep(this.intervalMs).then(release);
      } else {
        release();
      }
    }
  }
}

/** Limiters by provider name. */
const limiters = new Map<string, RateLimiter>();

/**
 * Read the configured spacing.
 *
 * `BETTER_WEB_SEARCH_RATE_LIMIT_MS=0` disables pacing, which is what the test
 * suite does so unit tests are not slowed by real waits.
 */
export function configuredIntervalMs(
  env: NodeJS.ProcessEnv = process.env,
): number {
  const raw = env.BETTER_WEB_SEARCH_RATE_LIMIT_MS;
  if (raw === undefined || raw.trim() === "") {
    return DEFAULT_INTERVAL_MS;
  }
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : DEFAULT_INTERVAL_MS;
}

/** The limiter for a provider, created on first use. */
export function limiterFor(name: string, intervalMs?: number): RateLimiter {
  let limiter = limiters.get(name);
  if (limiter === undefined) {
    limiter = new RateLimiter(name, intervalMs ?? configuredIntervalMs());
    limiters.set(name, limiter);
  } else if (intervalMs !== undefined) {
    limiter.setInterval(intervalMs);
  }
  return limiter;
}

/** Drop every limiter. Tests use this to avoid state leaking between cases. */
export function resetRateLimiters(): void {
  limiters.clear();
}
