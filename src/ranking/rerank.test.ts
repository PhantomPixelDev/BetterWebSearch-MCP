import { describe, expect, it } from "vitest";
import { rerank } from "./rerank.js";
import type { SearchResult } from "../providers/types.js";

function result(overrides: Partial<SearchResult>): SearchResult {
  return {
    title: "title",
    url: "https://example.com/page",
    snippet: "snippet",
    source: "test",
    ...overrides,
  };
}

describe("rerank", () => {
  it("ranks a result containing all query terms above one that does not", () => {
    const matching = result({
      title: "Laravel 12 authentication guide",
      snippet: "How to set up authentication in Laravel 12.",
      url: "https://laravel.com/docs",
    });
    const unrelated = result({
      title: "Cooking pasta recipes",
      snippet: "Delicious pasta dishes for dinner.",
      url: "https://example.com/pasta",
    });
    const ranked = rerank([unrelated, matching], "laravel authentication");
    expect(ranked[0]?.url).toBe("https://laravel.com/docs");
  });

  it("returns relevance scores in [0, 1]", () => {
    const ranked = rerank(
      [result({ title: "foo bar", snippet: "baz" })],
      "foo bar baz",
    );
    expect(ranked[0]?.relevance).toBeGreaterThanOrEqual(0);
    expect(ranked[0]?.relevance).toBeLessThanOrEqual(1);
  });

  it("sorts results by relevance descending", () => {
    const ranked = rerank(
      [
        result({ title: "unrelated", snippet: "nothing here" }),
        result({ title: "typescript strict mode", snippet: "typescript strict" }),
      ],
      "typescript strict",
    );
    const scores = ranked.map((r) => r.relevance);
    for (let i = 1; i < scores.length; i += 1) {
      expect(scores[i - 1]).toBeGreaterThanOrEqual(scores[i] ?? 0);
    }
  });

  it("boosts results published within the recency window", () => {
    const recent = result({
      title: "news today",
      snippet: "breaking",
      published: new Date().toISOString(),
    });
    const old = result({
      title: "news today",
      snippet: "breaking",
      published: "2020-01-01T00:00:00Z",
    });
    const ranked = rerank([old, recent], "news today", 30);
    expect(ranked[0]?.url).toBe(recent.url);
  });

  it("handles an empty results array", () => {
    expect(rerank([], "anything")).toEqual([]);
  });

  it("handles an empty query", () => {
    const ranked = rerank([result({ title: "foo", snippet: "bar" })], "");
    expect(ranked).toHaveLength(1);
    expect(ranked[0]?.relevance).toBeGreaterThanOrEqual(0);
  });

  it("does not mutate the input array", () => {
    const results = [result({ title: "foo", snippet: "bar" })];
    const snapshot = [...results];
    rerank(results, "foo");
    expect(results).toEqual(snapshot);
  });
});
