import { describe, expect, it, vi } from "vitest";

import { getPage, hasEnoughContent } from "./router.js";
import type { RouterDeps } from "./router.js";
import { Cache } from "../utils/cache.js";
import type { FetchedPage } from "./fetch.js";
import type { ReadabilityResult } from "./readability.js";
import type { StructuredData } from "./structured.js";
import type { PageMetadata } from "./metadata.js";
import type { CapturedApiResponse } from "./apiIntercept.js";

/** A long article body used to satisfy the >500 char readability check. */
const LONG_BODY = "word ".repeat(600).trim();

/** A readability result with a long markdown body. */
const READABLE: ReadabilityResult = {
  title: "Article Title",
  contentMarkdown: `# Article Title\n\n${LONG_BODY}`,
  textContent: LONG_BODY,
  excerpt: "An excerpt",
  length: LONG_BODY.length,
  byline: "Author",
};

/** A structured-data payload with a long articleBody. */
const STRUCTURED: StructuredData = {
  jsonLd: [
    {
      "@type": "Article",
      headline: "Structured Headline",
      articleBody: "structured ".repeat(60).trim(),
    },
  ],
  nextData: undefined,
  nextFlight: "",
  nuxt: undefined,
  apollo: undefined,
  initialState: undefined,
};

/** A captured API response. */
const CAPTURED: CapturedApiResponse[] = [
  {
    url: "https://example.com/api/products/1",
    method: "GET",
    contentType: "application/json",
    data: { name: "Widget" },
  },
];

/** Build a fetched-page fixture. */
function fetched(html: string, status = 200): FetchedPage {
  return { html, headers: { "content-type": "text/html" }, status, url: "https://example.com/p" };
}

/** A simple HTML page with enough visible text to pass Level 1. */
function articleHtml(): string {
  return `<html><head><title>Article Title</title></head><body><article><p>${LONG_BODY}</p></article></body></html>`;
}

/** A JS-shell page with no visible text but embedded structured data. */
function structuredHtml(): string {
  return `<html><head><title>Structured Page</title></head><body><script type="application/ld+json">${JSON.stringify(
    STRUCTURED.jsonLd[0],
  )}</script><div id="root"></div></body></html>`;
}

/** An empty shell page that needs a browser to render. */
function shellHtml(): string {
  return `<html><head><title>Shell</title></head><body><div id="root"></div></body></html>`;
}

/** An empty structured-data payload. */
const EMPTY_STRUCTURED: StructuredData = {
  jsonLd: [],
  nextData: undefined,
  nextFlight: "",
  nuxt: undefined,
  apollo: undefined,
  initialState: undefined,
};

/** Build a RouterDeps with mocks for every injectable seam. */
function makeDeps(overrides: Partial<RouterDeps> = {}): RouterDeps {
  return {
    cache: new Cache({ memory: true }),
    fetchPage: vi.fn(),
    extractWithReadability: vi.fn(),
    extractStructuredData: vi.fn().mockReturnValue(EMPTY_STRUCTURED),
    extractMetadata: vi.fn(),
    browserPool: undefined,
    ...overrides,
  };
}

describe("hasEnoughContent", () => {
  it("returns true when visible text exceeds 500 chars", () => {
    expect(hasEnoughContent(`<p>${LONG_BODY}</p>`)).toBe(true);
  });

  it("returns false for a short or script-only page", () => {
    expect(hasEnoughContent("<p>hi</p>")).toBe(false);
    expect(hasEnoughContent("<script>var x=1;</script>")).toBe(false);
  });
});

describe("getPage Level 1 (http_fetch)", () => {
  it("returns readability extraction without touching the browser", async () => {
    const deps = makeDeps({
      fetchPage: vi.fn().mockResolvedValue(fetched(articleHtml())),
      extractWithReadability: vi.fn().mockReturnValue(READABLE),
      extractMetadata: vi.fn().mockReturnValue({ title: "Article Title" } as PageMetadata),
    });

    const result = await getPage("https://example.com/p", {}, deps);

    expect(result.extraction.method).toBe("http_fetch");
    expect(result.extraction.confidence).toBe(0.85);
    expect(result.extraction.rendered).toBe(false);
    expect(result.content).toContain("Article Title");
    expect(deps.browserPool).toBeUndefined();
  });
});

describe("getPage Level 2 (hydration_data)", () => {
  it("short-circuits to structured data when the page has no readable text", async () => {
    const deps = makeDeps({
      fetchPage: vi.fn().mockResolvedValue(fetched(structuredHtml())),
      extractWithReadability: vi.fn().mockReturnValue(null),
      extractStructuredData: vi.fn().mockReturnValue(STRUCTURED),
      extractMetadata: vi.fn().mockReturnValue({ title: "Structured Page" } as PageMetadata),
    });

    const result = await getPage("https://example.com/p", {}, deps);

    expect(result.extraction.method).toBe("hydration_data");
    expect(result.extraction.confidence).toBe(0.9);
    expect(result.extraction.rendered).toBe(false);
    expect(result.structured_data).toBe(STRUCTURED);
    expect(result.content.length).toBeGreaterThan(200);
  });

  it("uses 0.95 confidence for a JSON-LD product page", async () => {
    const productStructured: StructuredData = {
      ...STRUCTURED,
      jsonLd: [
        {
          "@type": "Product",
          name: "Widget",
          description: "d ".repeat(300),
        },
      ],
    };
    const deps = makeDeps({
      fetchPage: vi.fn().mockResolvedValue(fetched(structuredHtml())),
      extractWithReadability: vi.fn().mockReturnValue(null),
      extractStructuredData: vi.fn().mockReturnValue(productStructured),
      extractMetadata: vi.fn().mockReturnValue({ title: "Product" } as PageMetadata),
    });

    const result = await getPage("https://example.com/p", {}, deps);

    expect(result.extraction.method).toBe("hydration_data");
    expect(result.extraction.confidence).toBe(0.95);
  });
});

describe("getPage Level 3 (browser)", () => {
  it("falls back to the browser only when HTTP is insufficient", async () => {
    const renderWithBrowser = vi.fn().mockResolvedValue({
      html: `<html><body><article><p>${LONG_BODY}</p></article></body></html>`,
      captured: CAPTURED,
    });
    const deps = makeDeps({
      fetchPage: vi.fn().mockResolvedValue(fetched(shellHtml())),
      extractWithReadability: vi.fn().mockReturnValue(null),
      extractStructuredData: vi.fn().mockReturnValue({
        jsonLd: [],
        nextData: undefined,
        nextFlight: "",
        nuxt: undefined,
        apollo: undefined,
        initialState: undefined,
      }),
      extractMetadata: vi.fn().mockReturnValue({ title: "Shell" } as PageMetadata),
      browserPool: { renderWithBrowser } as unknown as RouterDeps["browserPool"],
    });

    const result = await getPage("https://example.com/p", {}, deps);

    expect(renderWithBrowser).toHaveBeenCalledTimes(1);
    expect(result.extraction.method).toBe("browser_api_intercept");
    expect(result.extraction.confidence).toBe(0.96);
    expect(result.extraction.rendered).toBe(true);
    expect(result.api_endpoints).toEqual(CAPTURED);
  });

  it("uses rendered_dom 0.90 when no API data is captured", async () => {
    const renderWithBrowser = vi.fn().mockResolvedValue({
      html: `<html><body><article><p>${LONG_BODY}</p></article></body></html>`,
      captured: [],
    });
    const deps = makeDeps({
      fetchPage: vi.fn().mockResolvedValue(fetched(shellHtml())),
      extractWithReadability: vi.fn().mockReturnValue(null),
      extractStructuredData: vi.fn().mockReturnValue({
        jsonLd: [],
        nextData: undefined,
        nextFlight: "",
        nuxt: undefined,
        apollo: undefined,
        initialState: undefined,
      }),
      extractMetadata: vi.fn().mockReturnValue({ title: "Shell" } as PageMetadata),
      browserPool: { renderWithBrowser } as unknown as RouterDeps["browserPool"],
    });

    const result = await getPage("https://example.com/p", {}, deps);

    expect(result.extraction.method).toBe("rendered_dom");
    expect(result.extraction.confidence).toBe(0.9);
    expect(result.extraction.rendered).toBe(true);
    expect(result.api_endpoints).toBeUndefined();
  });

  it("does not launch the browser when browser_fallback is false", async () => {
    const renderWithBrowser = vi.fn();
    const deps = makeDeps({
      fetchPage: vi.fn().mockResolvedValue(fetched(shellHtml())),
      extractWithReadability: vi.fn().mockReturnValue(null),
      extractStructuredData: vi.fn().mockReturnValue({
        jsonLd: [],
        nextData: undefined,
        nextFlight: "",
        nuxt: undefined,
        apollo: undefined,
        initialState: undefined,
      }),
      extractMetadata: vi.fn().mockReturnValue({ title: "Shell" } as PageMetadata),
      browserPool: { renderWithBrowser } as unknown as RouterDeps["browserPool"],
    });

    const result = await getPage(
      "https://example.com/p",
      { browser_fallback: false },
      deps,
    );

    expect(renderWithBrowser).not.toHaveBeenCalled();
    expect(result.extraction.method).toBe("http_fetch");
    expect(result.extraction.confidence).toBe(0.5);
  });
});

describe("getPage cache integration", () => {
  it("short-circuits on a cache hit without fetching", async () => {
    const cache = new Cache({ memory: true });
    cache.setPage("https://example.com/p", "cached content", "http_fetch", 0.85);

    const fetchPage = vi.fn();
    const deps = makeDeps({ cache, fetchPage });

    const result = await getPage("https://example.com/p", {}, deps);

    expect(fetchPage).not.toHaveBeenCalled();
    expect(result.content).toBe("cached content");
    expect(result.extraction.method).toBe("http_fetch");
    expect(result.extraction.confidence).toBe(0.85);
  });

  it("stores the extraction in the cache after a successful fetch", async () => {
    const cache = new Cache({ memory: true });
    const deps = makeDeps({
      cache,
      fetchPage: vi.fn().mockResolvedValue(fetched(articleHtml())),
      extractWithReadability: vi.fn().mockReturnValue(READABLE),
      extractMetadata: vi.fn().mockReturnValue({ title: "Article Title" } as PageMetadata),
    });

    await getPage("https://example.com/p", {}, deps);

    const entry = cache.getPage("https://example.com/p");
    expect(entry).not.toBeNull();
    expect(entry?.extraction_method).toBe("http_fetch");
    expect(entry?.confidence).toBe(0.85);
  });
});
