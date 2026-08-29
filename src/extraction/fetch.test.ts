import { afterEach, describe, expect, it, vi } from "vitest";

import {
  FetchTimeoutError,
  NonHtmlError,
  fetchPage,
} from "./fetch.js";

describe("fetchPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("fetches HTML and returns html/headers/status/url", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      url: "https://example.com/article",
      headers: new Headers({ "content-type": "text/html; charset=utf-8" }),
      arrayBuffer: async () => new TextEncoder().encode("<html>hi</html>").buffer,
    });
    vi.stubGlobal("fetch", fetchMock);

    const page = await fetchPage("https://example.com/article");

    expect(page.status).toBe(200);
    expect(page.url).toBe("https://example.com/article");
    expect(page.html).toBe("<html>hi</html>");
    expect(page.headers["content-type"]).toContain("text/html");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://example.com/article");
    expect(init.redirect).toBe("follow");
    expect(init.headers).toMatchObject({
      "User-Agent": "BetterWebSearch-MCP/1.0",
    });
  });

  it("allows a missing content-type through", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        url: "https://example.com/",
        headers: new Headers(),
        arrayBuffer: async () => new TextEncoder().encode("<p>x</p>").buffer,
      }),
    );

    const page = await fetchPage("https://example.com/");

    expect(page.html).toBe("<p>x</p>");
  });

  it("throws NonHtmlError for non-HTML content-type", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        url: "https://example.com/file.pdf",
        headers: new Headers({ "content-type": "application/pdf" }),
        arrayBuffer: async () => new ArrayBuffer(0),
      }),
    );

    await expect(fetchPage("https://example.com/file.pdf")).rejects.toBeInstanceOf(
      NonHtmlError,
    );
  });

  it("returns the status code for a 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 404,
        url: "https://example.com/missing",
        headers: new Headers({ "content-type": "text/html" }),
        arrayBuffer: async () => new TextEncoder().encode("<h1>404</h1>").buffer,
      }),
    );

    const page = await fetchPage("https://example.com/missing");

    expect(page.status).toBe(404);
  });

  it("truncates the body to 2MB", async () => {
    const big = new TextEncoder().encode("a".repeat(3 * 1024 * 1024)).buffer;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        url: "https://example.com/big",
        headers: new Headers({ "content-type": "text/html" }),
        arrayBuffer: async () => big,
      }),
    );

    const page = await fetchPage("https://example.com/big");

    expect(page.html.length).toBe(2 * 1024 * 1024);
  });

  it("throws FetchTimeoutError when the request aborts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url: string, init: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => {
            const err = new Error("aborted");
            err.name = "AbortError";
            reject(err);
          });
        });
      }),
    );

    await expect(
      fetchPage("https://example.com/slow", { timeoutMs: 5 }),
    ).rejects.toBeInstanceOf(FetchTimeoutError);
  });

  it("propagates non-abort network errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    await expect(fetchPage("https://example.com/")).rejects.toThrow(
      "network down",
    );
  });
});
