import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CoolingDownError,
  DEFAULT_COOLDOWN_MS,
  DEFAULT_INTERVAL_MS,
  RateLimiter,
  configuredIntervalMs,
  limiterFor,
  resetRateLimiters,
} from "./rateLimit.js";

afterEach(() => {
  vi.useRealTimers();
  resetRateLimiters();
});

describe("RateLimiter pacing", () => {
  it("lets the first request through without waiting", async () => {
    const limiter = new RateLimiter("test", 1_000);
    const started = Date.now();

    await limiter.schedule(async () => "ok");

    // A single search must be no slower than before pacing existed.
    expect(Date.now() - started).toBeLessThan(200);
  });

  it("spaces concurrent requests instead of bursting", async () => {
    vi.useFakeTimers();
    const limiter = new RateLimiter("test", 1_000);
    const order: number[] = [];

    const calls = [0, 1, 2].map((n) =>
      limiter.schedule(async () => {
        order.push(n);
        return n;
      }),
    );

    // Only the first has run: the others are queued behind the interval.
    await vi.advanceTimersByTimeAsync(0);
    expect(order).toEqual([0]);

    await vi.advanceTimersByTimeAsync(1_000);
    expect(order).toEqual([0, 1]);

    await vi.advanceTimersByTimeAsync(1_000);
    expect(order).toEqual([0, 1, 2]);

    await expect(Promise.all(calls)).resolves.toEqual([0, 1, 2]);
  });

  it("runs back to back when the interval is zero", async () => {
    const limiter = new RateLimiter("test", 0);
    const order: number[] = [];

    await Promise.all(
      [0, 1, 2].map((n) => limiter.schedule(async () => void order.push(n))),
    );

    expect(order).toHaveLength(3);
  });

  it("releases the slot even when the call throws", async () => {
    const limiter = new RateLimiter("test", 0);

    await expect(
      limiter.schedule(async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    // A failure must not wedge the queue for every later caller.
    await expect(limiter.schedule(async () => "ok")).resolves.toBe("ok");
  });
});

describe("RateLimiter cooldown", () => {
  it("refuses immediately while cooling down, without running the call", async () => {
    const limiter = new RateLimiter("ddg", 0);
    const fn = vi.fn(async () => "ok");
    limiter.startCooldown(30_000);

    await expect(limiter.schedule(fn)).rejects.toBeInstanceOf(CoolingDownError);
    // The point is to stop asking an endpoint that is already turning us away.
    expect(fn).not.toHaveBeenCalled();
  });

  it("names the provider and the remaining wait", async () => {
    const limiter = new RateLimiter("duckduckgo", 0);
    limiter.startCooldown(30_000);

    await expect(limiter.schedule(async () => "ok")).rejects.toThrow(
      /duckduckgo is cooling down for another \d+s/,
    );
  });

  it("resumes once the cooldown elapses", async () => {
    vi.useFakeTimers();
    const limiter = new RateLimiter("test", 0);
    limiter.startCooldown(1_000);

    await expect(limiter.schedule(async () => "ok")).rejects.toBeInstanceOf(
      CoolingDownError,
    );

    vi.advanceTimersByTime(1_001);
    await expect(limiter.schedule(async () => "ok")).resolves.toBe("ok");
  });

  it("never shortens an active cooldown", () => {
    const limiter = new RateLimiter("test", 0);
    limiter.startCooldown(60_000);
    limiter.startCooldown(1_000);

    // A second refusal during a cooldown means the provider is still unhappy.
    expect(limiter.cooldownRemaining()).toBeGreaterThan(30_000);
  });

  it("can be cleared when a request succeeds again", () => {
    const limiter = new RateLimiter("test", 0);
    limiter.startCooldown(60_000);
    limiter.clearCooldown();

    expect(limiter.isCoolingDown()).toBe(false);
  });
});

describe("configuredIntervalMs", () => {
  it("defaults when unset", () => {
    expect(configuredIntervalMs({})).toBe(DEFAULT_INTERVAL_MS);
  });

  it("honours an explicit zero, which is how tests disable pacing", () => {
    expect(configuredIntervalMs({ BETTER_WEB_SEARCH_RATE_LIMIT_MS: "0" })).toBe(0);
  });

  it("accepts a custom interval", () => {
    expect(configuredIntervalMs({ BETTER_WEB_SEARCH_RATE_LIMIT_MS: "250" })).toBe(250);
  });

  it("falls back to the default for nonsense", () => {
    for (const raw of ["", "  ", "abc", "-5"]) {
      expect(configuredIntervalMs({ BETTER_WEB_SEARCH_RATE_LIMIT_MS: raw })).toBe(
        DEFAULT_INTERVAL_MS,
      );
    }
  });
});

describe("limiterFor", () => {
  it("returns the same limiter for a provider", () => {
    expect(limiterFor("brave")).toBe(limiterFor("brave"));
  });

  it("keeps providers independent", async () => {
    limiterFor("a", 0).startCooldown(60_000);

    expect(limiterFor("a", 0).isCoolingDown()).toBe(true);
    expect(limiterFor("b", 0).isCoolingDown()).toBe(false);
  });

  it("uses the documented default cooldown", () => {
    const limiter = new RateLimiter("test", 0);
    limiter.startCooldown();

    expect(limiter.cooldownRemaining()).toBeGreaterThan(DEFAULT_COOLDOWN_MS - 1_000);
  });
});
