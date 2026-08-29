import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { RoutedPage } from "../extraction/router.js";

const { getPageMock } = vi.hoisted(() => ({
  getPageMock: vi.fn(),
}));

vi.mock("../extraction/router.js", () => ({
  getPage: getPageMock,
}));

import { runExtract, extractInputSchema } from "./extract.js";

const routedPage: RoutedPage = {
  url: "https://example.com/article",
  title: "Example Article",
  content: "Full article content in markdown.",
  extraction: {
    method: "http_fetch",
    confidence: 0.85,
    rendered: false,
  },
  structured_data: undefined,
  api_endpoints: undefined,
  metadata: {
    title: "Example Article",
    description: "A description",
    published: "2025-01-01",
    author: "Jane",
    siteName: "Example",
  },
};

describe("extractInputSchema", () => {
  it("rejects an empty urls array", () => {
    const parsed = extractInputSchema.urls.safeParse([]);
    expect(parsed.success).toBe(false);
  });

  it("rejects a non-URL string", () => {
    const parsed = extractInputSchema.urls.safeParse(["not-a-url"]);
    expect(parsed.success).toBe(false);
  });

  it("accepts a valid URL array", () => {
    const parsed = extractInputSchema.urls.safeParse(["https://example.com"]);
    expect(parsed.success).toBe(true);
  });

  it("accepts only the allowed modes", () => {
    expect(extractInputSchema.mode.safeParse("auto").success).toBe(true);
    expect(extractInputSchema.mode.safeParse("fast").success).toBe(true);
    expect(extractInputSchema.mode.safeParse("browser").success).toBe(true);
    expect(extractInputSchema.mode.safeParse("nope").success).toBe(false);
  });
});

describe("runExtract", () => {
  beforeEach(() => {
    getPageMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a spec-shaped extraction per URL", async () => {
    getPageMock.mockResolvedValue(routedPage);

    const response = await runExtract({ urls: ["https://example.com/article"] });

    expect(response).toHaveLength(1);
    const entry = response[0];
    expect(entry?.url).toBe("https://example.com/article");
    expect(entry?.title).toBe("Example Article");
    expect(entry?.content).toContain("Full article content");
    expect(entry?.extraction.method).toBe("http_fetch");
    expect(entry?.extraction.confidence).toBe(0.85);
    expect(entry?.extraction.rendered).toBe(false);
    expect(entry?.metadata.published).toBe("2025-01-01");
  });

  it("processes multiple URLs and returns one entry each", async () => {
    getPageMock.mockImplementation(async (url: string) => ({
      ...routedPage,
      url,
      title: `Title for ${url}`,
    }));

    const urls = [
      "https://example.com/a",
      "https://example.com/b",
      "https://example.com/c",
    ];
    const response = await runExtract({ urls });

    expect(response).toHaveLength(3);
    expect(response.map((r) => r.url)).toEqual(urls);
    expect(getPageMock).toHaveBeenCalledTimes(3);
  });

  it("does not throw when a URL fails; returns a fallback extraction", async () => {
    getPageMock.mockRejectedValue(new Error("fetch failed"));

    const response = await runExtract({ urls: ["https://example.com/bad"] });

    expect(response).toHaveLength(1);
    const entry = response[0];
    expect(entry?.url).toBe("https://example.com/bad");
    expect(entry?.extraction.confidence).toBe(0);
    expect(entry?.content).toContain("Extraction failed");
  });

  it("does not throw when a URL times out; returns a fallback extraction", async () => {
    vi.useFakeTimers();
    try {
      // Never resolves — the 8s Promise.race timeout should produce a fallback.
      getPageMock.mockImplementation(() => new Promise(() => {}));

      const promise = runExtract({ urls: ["https://example.com/slow"] });
      await vi.advanceTimersByTimeAsync(8_001);

      const response = await promise;
      expect(response).toHaveLength(1);
      expect(response[0]?.extraction.confidence).toBe(0);
      expect(response[0]?.content).toContain("timed out");
    } finally {
      vi.useRealTimers();
    }
  });
});
