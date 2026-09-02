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

import { runResearch, researchInputSchema, densityWeight } from "./research.js";
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


describe("runResearch evidence accounting", () => {
  const WIRE =
    "The regulator approved the merger on Tuesday after a review lasting " +
    "eleven months, concluding that the combined operator would still face " +
    "meaningful competition in every regional market it serves nationwide.";
  const REPRINT =
    "EXCLUSIVE: The regulator approved the merger on Tuesday after a review " +
    "lasting eleven months, concluding that the combined operator would " +
    "still face meaningful competition in every regional market.";
  const SEPARATE =
    "Consumer groups criticised the decision, arguing that pricing data " +
    "submitted during the review understated the effect on rural customers " +
    "who rely on a single provider for fixed line broadband access today.";

  beforeEach(() => {
    aggregateSearchMock.mockResolvedValue([
      { title: "Wire", url: "https://wire.example/merger", snippet: "merger approved", source: "duckduckgo" },
      { title: "Outlet", url: "https://outlet.example/merger", snippet: "merger approved", source: "duckduckgo" },
      { title: "Analysis", url: "https://analysis.example/merger", snippet: "merger criticised", source: "duckduckgo" },
    ]);
    getPageMock.mockImplementation(async (url: string) => {
      if (url.includes("wire")) return routedPage(url, "Wire", WIRE);
      if (url.includes("outlet")) return routedPage(url, "Outlet", REPRINT);
      return routedPage(url, "Analysis", SEPARATE);
    });
  });

  it("counts syndicated reprints as one independent source", async () => {
    const res = await runResearch({ question: "Was the merger approved by the regulator?" });

    expect(res.evidence.sources_opened).toBe(3);
    // The wire story and its reprint are one account, not two.
    expect(res.evidence.independent_sources).toBe(2);
    expect(res.evidence.derivative_sources).toBe(1);
  });

  it("does not cite the same story twice through different outlets", async () => {
    const res = await runResearch({ question: "Was the merger approved by the regulator?" });

    const quotes = res.citations.map((c) => c.quote);
    const fromWire = quotes.filter((q) => q.includes("approved the merger")).length;
    expect(fromWire).toBeLessThanOrEqual(1);
  });

  it("reports query term coverage as a 0..1 fraction", async () => {
    const res = await runResearch({ question: "Was the merger approved by the regulator?" });

    expect(res.evidence.query_term_coverage).toBeGreaterThan(0);
    expect(res.evidence.query_term_coverage).toBeLessThanOrEqual(1);
  });

  it("reports cited_spans matching the citations array", async () => {
    const res = await runResearch({ question: "Was the merger approved by the regulator?" });

    expect(res.evidence.cited_spans).toBe(res.citations.length);
  });

  it("gives every citation an offset addressing its source content", async () => {
    const res = await runResearch({ question: "Was the merger approved by the regulator?" });

    for (const citation of res.citations) {
      expect(citation.end).toBeGreaterThan(citation.start);
      expect(citation.quote.length).toBeGreaterThan(0);
      expect(citation.url).toMatch(/^https:/);
    }
  });
});


describe("density weighting", () => {
  const SUBSTANCE =
    "Write-ahead logging changes how the database commits a transaction. " +
    "Instead of writing original content into a rollback journal, new content " +
    "is appended to a separate log file and the database is left untouched " +
    "until a checkpoint runs. Readers no longer block writers as a result.";
  const FILLER = [
    "[Home](/) [Menu](/m) [Search](/s) [Subscribe](/x) [Login](/l) [Deals](/d)",
    "",
    "Top 17 Best Databases in 2026",
    "",
    "Databases matter for business.",
    "",
    "Databases matter for business.",
    "",
    "Advertisement",
    "Sponsored",
    "Follow us",
    "Privacy Policy",
  ].join("\n");

  beforeEach(() => {
    aggregateSearchMock.mockResolvedValue([
      { title: "Farm", url: "https://farm.example/list", snippet: "databases", source: "duckduckgo" },
      { title: "Docs", url: "https://docs.example/wal", snippet: "write ahead logging", source: "duckduckgo" },
    ]);
    getPageMock.mockImplementation(async (url: string) =>
      url.includes("farm")
        ? routedPage(url, "Farm", `${FILLER}\n\nWrite-ahead logging is a database technique.`)
        : routedPage(url, "Docs", SUBSTANCE),
    );
  });

  it("counts thin pages in the evidence block", async () => {
    const res = await runResearch({ question: "What is write-ahead logging?" });

    expect(res.evidence.low_density_sources).toBeGreaterThanOrEqual(1);
    expect(res.evidence.low_density_sources).toBeLessThan(res.evidence.sources_opened);
  });

  it("ranks the substantial page's passage above the listicle's", async () => {
    const res = await runResearch({ question: "What is write-ahead logging?" });

    const top = [...res.citations].sort((a, b) => b.relevance - a.relevance)[0];
    expect(top?.url).toContain("docs.example");
  });

  it("still cites a thin page rather than discarding it", async () => {
    // A listicle can hold the one useful sentence, so weighting must not act
    // as a filter.
    const res = await runResearch({ question: "What is write-ahead logging?" });

    expect(res.citations.some((c) => c.url.includes("farm.example"))).toBe(true);
  });
});

describe("densityWeight", () => {
  it("never drops a page below half weight", () => {
    expect(densityWeight(0)).toBe(0.5);
    expect(densityWeight(1)).toBe(1);
    expect(densityWeight(0.5)).toBe(0.75);
  });

  it("clamps out-of-range input", () => {
    expect(densityWeight(-5)).toBe(0.5);
    expect(densityWeight(99)).toBe(1);
  });
});
