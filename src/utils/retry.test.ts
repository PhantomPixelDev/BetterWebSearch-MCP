import { afterEach, describe, expect, it, vi } from "vitest";

import { parseRetryAfter, withRetry } from "./retry.js";

function response(status: number, headers: Record<string, string> = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
  } as unknown as Response;
}

describe("parseRetryAfter", () => {
  it("parses a seconds value", () => {
    expect(parseRetryAfter("5")).toBe(5000);
  });

  it("parses an HTTP-date value", () => {
    const future = new Date(Date.now() + 10_000).toUTCString();
    const delay = parseRetryAfter(future);
    expect(delay).toBeGreaterThan(0);
    expect(delay).toBeLessThanOrEqual(10_000);
  });

  it("returns undefined for absent or empty values", () => {
    expect(parseRetryAfter(null)).toBeUndefined();
    expect(parseRetryAfter(undefined)).toBeUndefined();
    expect(parseRetryAfter("")).toBeUndefined();
    expect(parseRetryAfter("   ")).toBeUndefined();
  });

  it("returns undefined for unparseable values", () => {
    expect(parseRetryAfter("not-a-date")).toBeUndefined();
  });
});

describe("withRetry", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns the value immediately when it is not retryable", async () => {
    const fn = vi.fn<() => Promise<Response>>().mockResolvedValue(response(200));
    const result = await withRetry(fn);
    expect(result.status).toBe(200);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on 429 then succeeds", async () => {
    vi.useFakeTimers();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fn = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValueOnce(response(429))
      .mockResolvedValueOnce(response(200));

    const promise = withRetry(fn, { baseMs: 10 });
    await vi.advanceTimersByTimeAsync(10_000);

    const result = await promise;
    expect(result.status).toBe(200);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalled();
  });

  it("retries on 503 then succeeds", async () => {
    vi.useFakeTimers();
    const fn = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValueOnce(response(503))
      .mockResolvedValueOnce(response(200));

    const promise = withRetry(fn, { baseMs: 10 });
    await vi.advanceTimersByTimeAsync(10_000);

    const result = await promise;
    expect(result.status).toBe(200);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("honors Retry-After seconds over computed backoff", async () => {
    vi.useFakeTimers();
    const fn = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValueOnce(response(429, { "retry-after": "1" }))
      .mockResolvedValueOnce(response(200));

    const promise = withRetry(fn, { baseMs: 1000 });
    // Advance past the Retry-After delay (1s) but not the 1s backoff.
    await vi.advanceTimersByTimeAsync(1100);

    const result = await promise;
    expect(result.status).toBe(200);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("honors Retry-After HTTP-date", async () => {
    vi.useFakeTimers();
    const future = new Date(Date.now() + 500).toUTCString();
    const fn = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValueOnce(response(429, { "retry-after": future }))
      .mockResolvedValueOnce(response(200));

    const promise = withRetry(fn, { baseMs: 1000 });
    await vi.advanceTimersByTimeAsync(600);

    const result = await promise;
    expect(result.status).toBe(200);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("stops after maxRetries and returns the last retryable value", async () => {
    vi.useFakeTimers();
    const fn = vi.fn<() => Promise<Response>>().mockResolvedValue(response(429));

    const promise = withRetry(fn, { baseMs: 10, maxRetries: 2 });
    await vi.advanceTimersByTimeAsync(10_000);

    const result = await promise;
    expect(result.status).toBe(429);
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it("does not retry non-retryable status codes", async () => {
    const fn = vi.fn<() => Promise<Response>>().mockResolvedValue(response(400));
    const result = await withRetry(fn);
    expect(result.status).toBe(400);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("rethrows a thrown error with a retryable status after retries", async () => {
    vi.useFakeTimers();
    const err = Object.assign(new Error("boom"), { status: 503 });
    const fn = vi.fn().mockRejectedValue(err);

    const promise = withRetry(fn, { baseMs: 10, maxRetries: 1 });
    const assertion = expect(promise).rejects.toBe(err);
    await vi.advanceTimersByTimeAsync(10_000);

    await assertion;
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("rethrows a thrown error with a non-retryable status immediately", async () => {
    const err = Object.assign(new Error("boom"), { status: 500 });
    const fn = vi.fn().mockRejectedValue(err);

    await expect(withRetry(fn)).rejects.toBe(err);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries network errors when retryNetworkErrors is set", async () => {
    vi.useFakeTimers();
    const fn = vi
      .fn<() => Promise<Response>>()
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce(response(200));

    const promise = withRetry(fn, { baseMs: 10, retryNetworkErrors: true });
    await vi.advanceTimersByTimeAsync(10_000);

    const result = await promise;
    expect(result.status).toBe(200);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not retry network errors by default", async () => {
    const err = new Error("network down");
    const fn = vi.fn().mockRejectedValue(err);

    await expect(withRetry(fn)).rejects.toBe(err);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("never retries an abort, even with retryNetworkErrors set", async () => {
    // Providers share one AbortController across attempts, so once it has
    // fired a retry can only fail again instantly.
    const err = Object.assign(new Error("The operation was aborted"), {
      name: "AbortError",
    });
    const fn = vi.fn().mockRejectedValue(err);

    await expect(
      withRetry(fn, { retryNetworkErrors: true }),
    ).rejects.toBe(err);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
