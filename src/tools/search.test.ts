import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SearchResult } from "../providers/types.js";

const { aggregateSearchMock } = vi.hoisted(() => ({
  aggregateSearchMock: vi.fn(),
}));

vi.mock("../providers/index.js", () => ({
  aggregateSearch: aggregateSearchMock,
  // Tools call the detailed form; wrap the same mock so existing cases that
  // resolve a plain array keep working.
  aggregateSearchDetailed: async (...args: unknown[]) => ({
    results: await aggregateSearchMock(...args),
    warnings: [],
  }),
}));

import { runSearch, searchInputSchema } from "./search.js";
import { Cache } from "../utils/cache.js";

const results: SearchResult[] = [
  {
    title: "Laravel 12 authentication guide",
    url: "https://laravel.com/docs/12/authentication",
    snippet: "Learn how to authenticate users in Laravel 12.",
    published: "2025-01-10",
    source: "duckduckgo",
  },
  {
    title: "Laravel authentication",
    url: "https://laravel.com/docs/12/authentication?utm_source=test",
    snippet: "Authentication in Laravel.",
    published: "2025-01-10",
    source: "duckduckgo",
  },
  {
    title: "Unrelated cooking blog",
    url: "https://cooking.example/pasta",
    snippet: "How to make pasta.",
    source: "duckduckgo",
  },
];

describe("searchInputSchema", () => {
  it("rejects an empty query", () => {
    const parsed = searchInputSchema.query.safeParse("");
    expect(parsed.success).toBe(false);
  });

  it("accepts a non-empty query", () => {
    const parsed = searchInputSchema.query.safeParse("laravel");
    expect(parsed.success).toBe(true);
  });

  it("bounds max_results to 1-20", () => {
    expect(searchInputSchema.max_results.safeParse(0).success).toBe(false);
    expect(searchInputSchema.max_results.safeParse(21).success).toBe(false);
    expect(searchInputSchema.max_results.safeParse(10).success).toBe(true);
  });

  it("bounds recency_days to 0-365", () => {
    expect(searchInputSchema.recency_days.safeParse(-1).success).toBe(false);
    expect(searchInputSchema.recency_days.safeParse(366).success).toBe(false);
    expect(searchInputSchema.recency_days.safeParse(30).success).toBe(true);
  });
});

describe("runSearch", () => {
  beforeEach(() => {
    aggregateSearchMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns spec-shaped JSON with sources sorted by relevance", async () => {
    aggregateSearchMock.mockResolvedValue(results);

    const response = await runSearch({ query: "laravel authentication", max_results: 10 });

    expect(response.answer).toBe('Top 2 results for "laravel authentication"');
    expect(response.queries_used).toEqual(["laravel authentication"]);
    expect(response.sources).toHaveLength(2);

    // Deduplicated: the utm variant is collapsed into the canonical URL.
    const urls = response.sources.map((s) => s.url);
    expect(urls).toContain("https://laravel.com/docs/12/authentication");
    expect(urls).not.toContain(
      "https://laravel.com/docs/12/authentication?utm_source=test",
    );

    // Every source has the spec shape with a 0-1 relevance.
    for (const source of response.sources) {
      expect(source).toHaveProperty("title");
      expect(source).toHaveProperty("url");
      expect(source).toHaveProperty("snippet");
      expect(source.relevance).toBeGreaterThanOrEqual(0);
      expect(source.relevance).toBeLessThanOrEqual(1);
    }

    // The relevant Laravel result ranks above the unrelated cooking blog.
    expect(response.sources[0]?.title).toContain("Laravel");
  });

  it("respects max_results slicing", async () => {
    aggregateSearchMock.mockResolvedValue(results);
    const response = await runSearch({ query: "laravel", max_results: 1 });
    expect(response.sources).toHaveLength(1);
  });

  it("serves a cache hit without calling providers again", async () => {
    aggregateSearchMock.mockResolvedValue(results);
    const cache = new Cache({ memory: true });

    const first = await runSearch({ query: "laravel", cache });
    expect(aggregateSearchMock).toHaveBeenCalledTimes(1);

    const second = await runSearch({ query: "laravel", cache });
    expect(aggregateSearchMock).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });

  it("returns empty sources when no results are found", async () => {
    aggregateSearchMock.mockResolvedValue([]);
    const response = await runSearch({ query: "nothing here" });
    expect(response.sources).toHaveLength(0);
    expect(response.answer).toBe('Top 0 results for "nothing here"');
  });
});
