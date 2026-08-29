import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BraveProvider, freshnessFromRecencyDays } from "./brave.js";

describe("freshnessFromRecencyDays", () => {
  it("maps 1 day to pd", () => {
    expect(freshnessFromRecencyDays(1)).toBe("pd");
  });

  it("maps 7 days to pw", () => {
    expect(freshnessFromRecencyDays(7)).toBe("pw");
  });

  it("maps 30 days to pm", () => {
    expect(freshnessFromRecencyDays(30)).toBe("pm");
  });

  it("maps 365 days to py", () => {
    expect(freshnessFromRecencyDays(365)).toBe("py");
  });

  it("maps values beyond a year to a date range", () => {
    const value = freshnessFromRecencyDays(400);
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}to\d{4}-\d{2}-\d{2}$/);
  });

  it("returns undefined for non-positive days", () => {
    expect(freshnessFromRecencyDays(0)).toBeUndefined();
    expect(freshnessFromRecencyDays(-5)).toBeUndefined();
  });
});

describe("BraveProvider", () => {
  const originalKey = process.env.BRAVE_API_KEY;

  beforeEach(() => {
    process.env.BRAVE_API_KEY = "test-key";
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.BRAVE_API_KEY;
    } else {
      process.env.BRAVE_API_KEY = originalKey;
    }
    vi.restoreAllMocks();
  });

  it("returns [] and warns when BRAVE_API_KEY is missing", async () => {
    delete process.env.BRAVE_API_KEY;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const provider = new BraveProvider();

    const results = await provider.search("hello", {});

    expect(results).toEqual([]);
    expect(warn).toHaveBeenCalled();
  });

  it("sends the X-Subscription-Token header and maps results", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        web: {
          results: [
            {
              title: "Example",
              url: "https://example.com",
              description: "A description",
              extra_snippets: ["extra one", "extra two"],
              age: "2024-01-01",
            },
            {
              title: "No URL",
              url: "",
              description: "should be filtered",
            },
          ],
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const provider = new BraveProvider();

    const results = await provider.search("hello world", {
      count: 5,
      recency_days: 7,
      extraSnippets: true,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("q=hello+world");
    expect(url).toContain("count=5");
    expect(url).toContain("freshness=pw");
    expect(url).toContain("extra_snippets=true");
    expect(init.headers).toMatchObject({ "X-Subscription-Token": "test-key" });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      title: "Example",
      url: "https://example.com",
      snippet: "A description extra one extra two",
      published: "2024-01-01",
      source: "brave",
    });
  });

  it("returns [] on 401 without throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 401 }),
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const provider = new BraveProvider();

    const results = await provider.search("hello", {});

    expect(results).toEqual([]);
    expect(warn).toHaveBeenCalled();
  });

  it("returns [] on 429 without throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 429 }),
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const provider = new BraveProvider();

    const results = await provider.search("hello", {});

    expect(results).toEqual([]);
    expect(warn).toHaveBeenCalled();
  });

  it("retries on 429 then succeeds", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 429 })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          web: {
            results: [
              {
                title: "Example",
                url: "https://example.com",
                description: "A description",
              },
            ],
          },
        }),
      });
    vi.stubGlobal("fetch", fetchMock);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const provider = new BraveProvider();

    const promise = provider.search("hello", {});
    await vi.advanceTimersByTimeAsync(10_000);
    const results = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(results).toHaveLength(1);
    expect(results[0]?.title).toBe("Example");
    expect(warn).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("returns [] when fetch rejects (timeout/network) without throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const provider = new BraveProvider();

    const results = await provider.search("hello", {});

    expect(results).toEqual([]);
    expect(warn).toHaveBeenCalled();
  });
});
