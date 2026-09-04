import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SearchResult } from "../providers/types.js";

const { aggregateSearchMock } = vi.hoisted(() => ({
  aggregateSearchMock: vi.fn(),
}));

vi.mock("../providers/index.js", () => ({
  aggregateSearch: aggregateSearchMock,
  aggregateSearchDetailed: async (...args: unknown[]) => ({
    results: await aggregateSearchMock(...args),
    warnings: [],
  }),
}));

import { runNews } from "./news.js";

/** A result published `daysAgo` days back. */
function dated(url: string, daysAgo: number, title = "Headline"): SearchResult {
  return {
    title,
    url,
    snippet: "snippet",
    published: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
    source: "brave",
  };
}

/** A result with no publication date, as the keyless provider returns. */
function undated(url: string, title = "Headline"): SearchResult {
  return { title, url, snippet: "snippet", source: "duckduckgo" };
}

describe("runNews with dated results", () => {
  beforeEach(() => {
    aggregateSearchMock.mockReset();
  });

  it("keeps results inside the window and reports recency as verified", async () => {
    aggregateSearchMock.mockResolvedValue([
      dated("https://a.example/1", 1),
      dated("https://b.example/2", 3),
      dated("https://c.example/3", 400),
    ]);

    const res = await runNews({ topic: "elections", recency_days: 7 });

    expect(res.recency_verified).toBe(true);
    expect(res.sources).toHaveLength(2);
    expect(res.sources.map((s) => s.url)).not.toContain("https://c.example/3");
    expect(res.answer).toContain("within 7 days");
    expect(res.warnings).toBeUndefined();
  });

  it("groups dated sources into a timeline", async () => {
    aggregateSearchMock.mockResolvedValue([
      dated("https://a.example/1", 1),
      dated("https://b.example/2", 1),
    ]);

    const res = await runNews({ topic: "elections", recency_days: 7 });

    expect(Object.keys(res.timeline).length).toBeGreaterThan(0);
  });

  it("does not mix undated results in when dated ones exist", async () => {
    aggregateSearchMock.mockResolvedValue([
      dated("https://a.example/1", 1),
      undated("https://b.example/2"),
    ]);

    const res = await runNews({ topic: "elections", recency_days: 7 });

    expect(res.recency_verified).toBe(true);
    expect(res.sources.map((s) => s.url)).toEqual(["https://a.example/1"]);
  });
});

describe("runNews on the keyless path", () => {
  beforeEach(() => {
    aggregateSearchMock.mockReset();
  });

  it("returns topical results rather than nothing when no date is available", async () => {
    // Requiring a publication date made this return an empty list for every
    // topic keyless, which reads exactly like "no news exists".
    aggregateSearchMock.mockResolvedValue([
      undated("https://a.example/1"),
      undated("https://b.example/2"),
    ]);

    const res = await runNews({ topic: "artificial intelligence" });

    expect(res.sources).toHaveLength(2);
  });

  it("marks recency as unverified and says why", async () => {
    aggregateSearchMock.mockResolvedValue([undated("https://a.example/1")]);

    const res = await runNews({ topic: "artificial intelligence" });

    expect(res.recency_verified).toBe(false);
    expect(res.answer).toContain("recency unverified");
    expect(res.warnings?.[0]).toMatch(/BRAVE_API_KEY|TAVILY_API_KEY/);
  });

  it("does not claim a recency window it cannot support", async () => {
    aggregateSearchMock.mockResolvedValue([undated("https://a.example/1")]);

    const res = await runNews({ topic: "ai", recency_days: 7 });

    expect(res.answer).not.toContain("within 7 days");
  });

  it("leaves the timeline empty, since there are no dates to group by", async () => {
    aggregateSearchMock.mockResolvedValue([undated("https://a.example/1")]);

    const res = await runNews({ topic: "ai" });

    expect(res.timeline).toEqual({});
  });
});

describe("runNews result shaping", () => {
  beforeEach(() => {
    aggregateSearchMock.mockReset();
  });

  it("keeps at most one result per host", async () => {
    aggregateSearchMock.mockResolvedValue([
      dated("https://same.example/1", 1),
      dated("https://same.example/2", 1),
      dated("https://other.example/3", 1),
    ]);

    const res = await runNews({ topic: "elections", recency_days: 7 });

    expect(res.sources).toHaveLength(2);
  });

  it("respects max_results", async () => {
    aggregateSearchMock.mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => dated(`https://h${i}.example/`, 1)),
    );

    const res = await runNews({ topic: "elections", max_results: 3 });

    expect(res.sources).toHaveLength(3);
  });

  it("returns an empty result set when the search found nothing", async () => {
    aggregateSearchMock.mockResolvedValue([]);

    const res = await runNews({ topic: "nothing at all" });

    expect(res.sources).toEqual([]);
    expect(res.recency_verified).toBe(false);
    // Nothing to caveat: there are no results to mislabel.
    expect(res.warnings).toBeUndefined();
  });
});
