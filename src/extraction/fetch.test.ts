import { afterEach, describe, expect, it, vi } from "vitest";

import {
  FetchTimeoutError,
  NonHtmlError,
  TooManyRedirectsError,
  fetchPage,
} from "./fetch.js";
import { BlockedUrlError, type SsrfDeps } from "../utils/ssrf.js";

/**
 * Resolve every hostname to a public address.
 *
 * fetchPage runs the SSRF guard before it calls fetch, so without an injected
 * resolver these tests would depend on real DNS.
 */
const ssrf: SsrfDeps = { resolve: async () => ["93.184.216.34"] };

/** A minimal fetch response double. */
function response(opts: {
  status?: number;
  url?: string;
  headers?: Record<string, string>;
  body?: string | ArrayBuffer;
}): unknown {
  const body = opts.body ?? "";
  return {
    status: opts.status ?? 200,
    url: opts.url ?? "https://example.com/",
    headers: new Headers(opts.headers ?? {}),
    arrayBuffer: async () =>
      typeof body === "string" ? new TextEncoder().encode(body).buffer : body,
  };
}

describe("fetchPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("fetches HTML and returns html/headers/status/url", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      response({
        url: "https://example.com/article",
        headers: { "content-type": "text/html; charset=utf-8" },
        body: "<html>hi</html>",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const page = await fetchPage("https://example.com/article", { ssrf });

    expect(page.status).toBe(200);
    expect(page.url).toBe("https://example.com/article");
    expect(page.html).toBe("<html>hi</html>");
    expect(page.headers["content-type"]).toContain("text/html");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://example.com/article");
    // Manual, so every redirect hop goes back through the SSRF guard.
    expect(init.redirect).toBe("manual");
    expect(init.headers).toMatchObject({
      "User-Agent": "BetterWebSearch-MCP/1.0",
    });
  });

  it("allows a missing content-type through", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(response({ body: "<p>x</p>" })),
    );

    const page = await fetchPage("https://example.com/", { ssrf });

    expect(page.html).toBe("<p>x</p>");
  });

  it("throws NonHtmlError for non-HTML content-type", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response({
          url: "https://example.com/file.pdf",
          headers: { "content-type": "application/pdf" },
        }),
      ),
    );

    await expect(
      fetchPage("https://example.com/file.pdf", { ssrf }),
    ).rejects.toBeInstanceOf(NonHtmlError);
  });

  it("returns the status code for a 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response({
          status: 404,
          url: "https://example.com/missing",
          headers: { "content-type": "text/html" },
          body: "<h1>404</h1>",
        }),
      ),
    );

    const page = await fetchPage("https://example.com/missing", { ssrf });

    expect(page.status).toBe(404);
  });

  it("truncates the body to 2MB", async () => {
    const big = new TextEncoder().encode("a".repeat(3 * 1024 * 1024)).buffer;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response({
          url: "https://example.com/big",
          headers: { "content-type": "text/html" },
          body: big,
        }),
      ),
    );

    const page = await fetchPage("https://example.com/big", { ssrf });

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
      fetchPage("https://example.com/slow", { timeoutMs: 20, ssrf }),
    ).rejects.toBeInstanceOf(FetchTimeoutError);
  });

  it("propagates non-abort network errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    await expect(fetchPage("https://example.com/", { ssrf })).rejects.toThrow(
      "network down",
    );
  });
});

describe("fetchPage SSRF guard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("refuses a loopback URL without issuing a request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchPage("http://localhost:8080/admin")).rejects.toBeInstanceOf(
      BlockedUrlError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses the cloud metadata address", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchPage("http://169.254.169.254/latest/meta-data/"),
    ).rejects.toBeInstanceOf(BlockedUrlError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a public hostname that resolves to a private address", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchPage("https://rebind.example/", {
        ssrf: { resolve: async () => ["10.0.0.5"] },
      }),
    ).rejects.toBeInstanceOf(BlockedUrlError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("re-checks the guard after a redirect, not just the first URL", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        response({
          status: 302,
          headers: { location: "http://169.254.169.254/latest/meta-data/" },
        }),
      )
      .mockResolvedValue(response({ body: "secret" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchPage("https://public.example/start", { ssrf }),
    ).rejects.toBeInstanceOf(BlockedUrlError);
    // The redirect target must never be requested.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("follows a redirect to another public host", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        response({
          status: 301,
          headers: { location: "https://other.example/final" },
        }),
      )
      .mockResolvedValueOnce(
        response({
          url: "https://other.example/final",
          headers: { "content-type": "text/html" },
          body: "<p>ok</p>",
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const page = await fetchPage("https://public.example/start", { ssrf });

    expect(page.html).toBe("<p>ok</p>");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("gives up on a redirect loop", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response({
          status: 302,
          headers: { location: "https://loop.example/next" },
        }),
      ),
    );

    await expect(
      fetchPage("https://loop.example/start", { ssrf }),
    ).rejects.toBeInstanceOf(TooManyRedirectsError);
  });

  it("can be bypassed explicitly for local fixture servers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(response({ body: "<p>local</p>" })),
    );

    const page = await fetchPage("http://127.0.0.1:9999/", {
      allowPrivateHosts: true,
    });

    expect(page.html).toBe("<p>local</p>");
  });
});
