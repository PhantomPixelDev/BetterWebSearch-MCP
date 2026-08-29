import { describe, expect, it } from "vitest";
import { deduplicate, normalizeUrl } from "./deduplicate.js";
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

describe("normalizeUrl", () => {
  it("lowercases the hostname", () => {
    expect(normalizeUrl("https://EXAMPLE.com/Path")).toBe(
      "https://example.com/Path",
    );
  });

  it("strips utm_* tracking params", () => {
    expect(
      normalizeUrl("https://example.com/page?utm_source=x&utm_medium=y&a=1"),
    ).toBe("https://example.com/page?a=1");
  });

  it("strips gclid and fbclid params", () => {
    expect(
      normalizeUrl("https://example.com/page?gclid=abc&fbclid=def&q=1"),
    ).toBe("https://example.com/page?q=1");
  });

  it("sorts remaining query params", () => {
    expect(normalizeUrl("https://example.com/page?b=2&a=1")).toBe(
      "https://example.com/page?a=1&b=2",
    );
  });

  it("removes trailing slash except root", () => {
    expect(normalizeUrl("https://example.com/page/")).toBe(
      "https://example.com/page",
    );
    expect(normalizeUrl("https://example.com/")).toBe("https://example.com/");
  });

  it("drops the hash fragment", () => {
    expect(normalizeUrl("https://example.com/page#section")).toBe(
      "https://example.com/page",
    );
  });

  it("returns undefined for malformed URLs", () => {
    expect(normalizeUrl("not a url")).toBeUndefined();
    expect(normalizeUrl("")).toBeUndefined();
  });
});

describe("deduplicate", () => {
  it("keeps the highest score per normalized URL", () => {
    const results = [
      result({ url: "https://example.com/page?utm_source=x", score: 0.3 }),
      result({ url: "https://example.com/page", score: 0.9 }),
    ];
    const deduped = deduplicate(results);
    expect(deduped).toHaveLength(1);
    expect(deduped[0]?.score).toBe(0.9);
  });

  it("treats utm variants as the same URL", () => {
    const results = [
      result({ url: "https://example.com/a?utm_campaign=c1" }),
      result({ url: "https://example.com/a" }),
    ];
    expect(deduplicate(results)).toHaveLength(1);
  });

  it("skips malformed URLs without throwing", () => {
    const results = [
      result({ url: "not a url", score: 0.9 }),
      result({ url: "https://example.com/ok", score: 0.5 }),
    ];
    const deduped = deduplicate(results);
    expect(deduped).toHaveLength(1);
    expect(deduped[0]?.url).toBe("https://example.com/ok");
  });

  it("handles an empty array", () => {
    expect(deduplicate([])).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const results = [
      result({ url: "https://example.com/a?utm_source=x" }),
      result({ url: "https://example.com/a" }),
    ];
    const snapshot = [...results];
    deduplicate(results);
    expect(results).toEqual(snapshot);
  });
});
