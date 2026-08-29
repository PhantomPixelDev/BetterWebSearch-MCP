import { afterEach, describe, expect, it, vi } from "vitest";

import { DuckDuckGoProvider, parseHtmlResults } from "./duckduckgo.js";

const SAMPLE_HTML = `
<html><body>
  <div class="result">
    <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fpage">Example Title</a>
    <a class="result__url" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fpage">example.com</a>
    <a class="result__snippet" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fpage">A snippet here</a>
  </div>
  <div class="result">
    <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fsecond.org%2F">Second Title</a>
    <a class="result__url" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fsecond.org%2F">second.org</a>
    <a class="result__snippet" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fsecond.org%2F">Second snippet</a>
  </div>
</body></html>
`;

describe("parseHtmlResults", () => {
  it("parses results and decodes uddg redirect URLs", () => {
    const results = parseHtmlResults(SAMPLE_HTML, 10);

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      title: "Example Title",
      url: "https://example.com/page",
      snippet: "A snippet here",
      source: "duckduckgo",
    });
    expect(results[1]?.url).toBe("https://second.org/");
  });

  it("respects the limit", () => {
    const results = parseHtmlResults(SAMPLE_HTML, 1);
    expect(results).toHaveLength(1);
  });

  it("skips results without a title or url", () => {
    const html = `
      <div class="result">
        <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fok.org%2F">OK</a>
        <a class="result__url" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fok.org%2F">ok.org</a>
      </div>
      <div class="result">
        <a class="result__url" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fmissing.org%2F">missing.org</a>
      </div>
    `;
    const results = parseHtmlResults(html, 10);
    expect(results).toHaveLength(1);
    expect(results[0]?.title).toBe("OK");
  });
});

describe("DuckDuckGoProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches the html endpoint and returns parsed results", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => SAMPLE_HTML,
      }),
    );
    const provider = new DuckDuckGoProvider();

    const results = await provider.search("hello world", { count: 10 });

    expect(results).toHaveLength(2);
    expect(results[0]?.source).toBe("duckduckgo");
  });

  it("returns [] on non-ok response without throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503 }),
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const provider = new DuckDuckGoProvider();

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
        text: async () => SAMPLE_HTML,
      });
    vi.stubGlobal("fetch", fetchMock);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const provider = new DuckDuckGoProvider();

    const promise = provider.search("hello", { count: 10 });
    await vi.advanceTimersByTimeAsync(10_000);
    const results = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(results).toHaveLength(2);
    expect(results[0]?.source).toBe("duckduckgo");
    expect(warn).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("returns [] when fetch rejects (timeout) without throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("aborted")),
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const provider = new DuckDuckGoProvider();

    const results = await provider.search("hello", {});

    expect(results).toEqual([]);
    expect(warn).toHaveBeenCalled();
  });
});
