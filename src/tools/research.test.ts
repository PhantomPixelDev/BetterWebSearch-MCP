import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SearchResult } from "../providers/types.js";
import type { RoutedPage } from "../extraction/router.js";

const { aggregateSearchMock, getPageMock } = vi.hoisted(() => ({
  aggregateSearchMock: vi.fn(),
  getPageMock: vi.fn(),
}));

vi.mock("../providers/index.js", () => ({
  aggregateSearch: aggregateSearchMock,
}));

vi.mock("../extraction/router.js", () => ({
  getPage: getPageMock,
}));

import { runResearch, researchInputSchema } from "./research.js";
import { Cache } from "../utils/cache.js";

const results: SearchResult[] = [
  {
    title: "Cheapest unlimited mobile internet in Germany",
    url: "https://example.com/cheapest-unlimited",
    snippet: "Compare the cheapest unlimited mobile internet plans in Germany.",
    published: "2025-01-10",
    source: "duckduckgo",
  },
  {
    title: "Unlimited data plans Germany comparison",
    url: "https://example.com/unlimited-data",
    snippet: "A comparison of unlimited data plans available in Germany.",
    published: "2025-01-12",
    source: "duckduckgo",
  },
  {
    title: "Unrelated cooking blog",
    url: "https://cooking.example/pasta",
    snippet: "How to make pasta.",
    source: "duckduckgo",
  },
];

function routedPage(url: string, title: string, content: string): RoutedPage {
  return {
    url,
    title,
    content,
    extraction: {
      method: "http_fetch",
      confidence: 0.85,
      rendered: false,
    },
    structured_data: undefined,
    api_endpoints: undefined,
    metadata: {
      title,
      description: "",
      published: "2025-01-10",
      author: "",
      siteName: "",
    },
  };
}

describe("researchInputSchema", () => {
  it("rejects an empty question", () => {
    const parsed = researchInputSchema.question.safeParse("");
    expect(parsed.success).toBe(false);
  });

  it("accepts a non-empty question", () => {
    const parsed = researchInputSchema.question.safeParse("cheapest mobile internet");
    expect(parsed.success).toBe(true);
  });

  it("accepts only the allowed depths", () => {
    expect(researchInputSchema.depth.safeParse("quick").success).toBe(true);
    expect(researchInputSchema.depth.safeParse("deep").success).toBe(true);
    expect(researchInputSchema.depth.safeParse("nope").success).toBe(false);
  });

  it("bounds count_per_query to 1-10", () => {
    expect(researchInputSchema.count_per_query.safeParse(0).success).toBe(false);
    expect(researchInputSchema.count_per_query.safeParse(11).success).toBe(false);
    expect(researchInputSchema.count_per_query.safeParse(5).success).toBe(true);
  });
});

describe("runResearch", () => {
  beforeEach(() => {
    aggregateSearchMock.mockReset();
    getPageMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns spec-shaped JSON with 4-6 queries and sorted sources", async () => {
    aggregateSearchMock.mockResolvedValue(results);
    getPageMock.mockImplementation(async (url: string) =>
      routedPage(url, `Title for ${url}`, `Content for ${url}`),
    );

    const response = await runResearch({
      question: "cheapest unlimited mobile internet Germany",
    });

    // 4-6 query variants for deep depth.
    expect(response.queries_used.length).toBeGreaterThanOrEqual(4);
    expect(response.queries_used.length).toBeLessThanOrEqual(6);
    expect(response.queries_used[0]).toBe("cheapest unlimited mobile internet Germany");

    // Sources sorted by relevance descending.
    const relevances = response.sources.map((s) => s.relevance);
    const sorted = [...relevances].sort((a, b) => b - a);
    expect(relevances).toEqual(sorted);

    // Every source has the spec shape.
    for (const source of response.sources) {
      expect(source).toHaveProperty("title");
      expect(source).toHaveProperty("url");
      expect(source).toHaveProperty("snippet");
      expect(source.relevance).toBeGreaterThanOrEqual(0);
      expect(source.relevance).toBeLessThanOrEqual(1);
    }

    // Answer contains a citation marker and the source count.
    expect(response.answer).toContain("Based on");
    expect(response.answer).toContain("[1]");

    // Extraction stats present.
    expect(response.extraction_stats.method_counts).toBeDefined();
    expect(response.extraction_stats.avgConfidence).toBeGreaterThan(0);
  });

  it("invokes all parallel searches (one aggregateSearch call per variant)", async () => {
    aggregateSearchMock.mockResolvedValue(results);
    getPageMock.mockResolvedValue(routedPage("https://example.com/x", "X", "Content"));

    const response = await runResearch({
      question: "cheapest unlimited mobile internet Germany",
    });

    // One aggregateSearch call per query variant, each with the variant as query.
    expect(aggregateSearchMock).toHaveBeenCalledTimes(response.queries_used.length);
    for (const query of response.queries_used) {
      expect(aggregateSearchMock).toHaveBeenCalledWith(
        query,
        expect.objectContaining({ count: 5 }),
      );
    }
  });

  it("uses fewer variants for quick depth", async () => {
    aggregateSearchMock.mockResolvedValue(results);
    getPageMock.mockResolvedValue(routedPage("https://example.com/x", "X", "Content"));

    const deep = await runResearch({
      question: "cheapest unlimited mobile internet Germany",
      depth: "deep",
    });
    const quick = await runResearch({
      question: "cheapest unlimited mobile internet Germany",
      depth: "quick",
    });

    expect(quick.queries_used.length).toBeLessThan(deep.queries_used.length);
    expect(quick.queries_used.length).toBeLessThanOrEqual(2);
  });

  it("returns No results found (not throw) when no results are found", async () => {
    aggregateSearchMock.mockResolvedValue([]);
    getPageMock.mockResolvedValue(routedPage("https://example.com/x", "X", "Content"));

    const response = await runResearch({ question: "nothing here" });

    expect(response.sources).toHaveLength(0);
    expect(response.answer).toBe("No results found");
    expect(response.extraction_stats.avgConfidence).toBe(0);
  });

  it("does not abort other pages when one getPage fails (allSettled semantics)", async () => {
    aggregateSearchMock.mockResolvedValue(results);
    getPageMock.mockImplementation(async (url: string) => {
      if (url.includes("cooking")) {
        throw new Error("fetch failed");
      }
      return routedPage(url, `Title for ${url}`, `Content for ${url}`);
    });

    const response = await runResearch({
      question: "cheapest unlimited mobile internet Germany",
    });

    // The failing page is skipped, but the others still produce content.
    expect(response.answer).toContain("Based on");
    expect(response.answer).not.toContain("No results found");
    expect(getPageMock).toHaveBeenCalled();
  });

  it("serves a cache hit without calling providers again", async () => {
    aggregateSearchMock.mockResolvedValue(results);
    getPageMock.mockResolvedValue(routedPage("https://example.com/x", "X", "Content"));
    const cache = new Cache({ memory: true });

    const first = await runResearch({
      question: "cheapest unlimited mobile internet Germany",
      cache,
    });
    const callsAfterFirst = aggregateSearchMock.mock.calls.length;

    const second = await runResearch({
      question: "cheapest unlimited mobile internet Germany",
      cache,
    });

    expect(aggregateSearchMock.mock.calls.length).toBe(callsAfterFirst);
    expect(second).toEqual(first);
  });
});
