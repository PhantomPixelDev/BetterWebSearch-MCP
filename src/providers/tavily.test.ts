import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TavilyProvider } from "./tavily.js";

describe("TavilyProvider", () => {
  const originalKey = process.env.TAVILY_API_KEY;

  beforeEach(() => {
    process.env.TAVILY_API_KEY = "test-key";
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.TAVILY_API_KEY;
    } else {
      process.env.TAVILY_API_KEY = originalKey;
    }
    vi.restoreAllMocks();
  });

  it("returns [] and warns when TAVILY_API_KEY is missing", async () => {
    delete process.env.TAVILY_API_KEY;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const provider = new TavilyProvider();

    const results = await provider.search("hello", {});

    expect(results).toEqual([]);
    expect(warn).toHaveBeenCalled();
  });

  it("POSTs with Bearer auth and maps results", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        results: [
          {
            title: "Tavily Result",
            url: "https://tavily.com/result",
            content: "Some content",
            published_date: "2024-02-02",
            score: 0.9,
          },
          {
            title: "No URL",
            url: "",
            content: "filtered",
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const provider = new TavilyProvider();

    const results = await provider.search("hello world", {
      count: 3,
      recency_days: 30,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.tavily.com/search");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer test-key",
      "Content-Type": "application/json",
    });
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body).toMatchObject({
      query: "hello world",
      max_results: 3,
      time_range: "30d",
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      title: "Tavily Result",
      url: "https://tavily.com/result",
      snippet: "Some content",
      published: "2024-02-02",
      score: 0.9,
      source: "tavily",
    });
  });

  it("returns [] on non-ok response without throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const provider = new TavilyProvider();

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
          results: [
            {
              title: "Tavily Result",
              url: "https://tavily.com/result",
              content: "Some content",
            },
          ],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const provider = new TavilyProvider();

    const promise = provider.search("hello", {});
    await vi.advanceTimersByTimeAsync(10_000);
    const results = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(results).toHaveLength(1);
    expect(results[0]?.title).toBe("Tavily Result");
    expect(warn).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("returns [] when fetch rejects without throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("timeout")),
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const provider = new TavilyProvider();

    const results = await provider.search("hello", {});

    expect(results).toEqual([]);
    expect(warn).toHaveBeenCalled();
  });
});
