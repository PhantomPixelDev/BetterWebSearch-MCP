import { describe, expect, it } from "vitest";

import {
  DUPLICATE_THRESHOLD,
  analyzeIndependence,
  countIndependent,
  hostOf,
  jaccard,
  shingles,
} from "./independence.js";

/** A wire story long enough to fingerprint meaningfully. */
const WIRE =
  "The central bank raised interest rates by a quarter point on Tuesday, " +
  "citing persistent inflation in the services sector and a labour market " +
  "that remains tighter than policymakers had expected at the start of the " +
  "year. Officials signalled that further increases remain possible should " +
  "price pressures fail to ease over the coming quarters.";

/** The same story with a house intro and a trimmed tail, as an outlet would run it. */
const WIRE_REPRINT =
  "BREAKING: The central bank raised interest rates by a quarter point on " +
  "Tuesday, citing persistent inflation in the services sector and a labour " +
  "market that remains tighter than policymakers had expected at the start " +
  "of the year. Officials signalled that further increases remain possible.";

/** Genuinely different reporting on the same topic. */
const INDEPENDENT =
  "Regional lenders reported a sharp drop in mortgage applications last " +
  "month, according to figures compiled by an industry association. Brokers " +
  "described the slowdown as the steepest since the pandemic, with first " +
  "time buyers accounting for most of the decline in submitted paperwork.";

describe("shingles", () => {
  it("builds overlapping word k-grams", () => {
    const set = shingles("one two three four five six", 5);

    expect(set.has("one two three four five")).toBe(true);
    expect(set.has("two three four five six")).toBe(true);
    expect(set.size).toBe(2);
  });

  it("falls back to the whole token string when too short", () => {
    expect([...shingles("only three words", 5)]).toEqual(["only three words"]);
  });

  it("returns nothing for empty text", () => {
    expect(shingles("").size).toBe(0);
  });

  it("ignores case and punctuation", () => {
    expect(shingles("Hello, World! Foo bar baz", 5)).toEqual(
      shingles("hello world foo bar baz", 5),
    );
  });
});

describe("jaccard", () => {
  it("is 1 for identical sets and 0 for disjoint ones", () => {
    const a = new Set(["x", "y"]);
    expect(jaccard(a, new Set(["x", "y"]))).toBe(1);
    expect(jaccard(a, new Set(["p", "q"]))).toBe(0);
  });

  it("computes intersection over union", () => {
    expect(jaccard(new Set(["a", "b", "c"]), new Set(["b", "c", "d"]))).toBeCloseTo(
      2 / 4,
    );
  });

  it("is 0 when either set is empty", () => {
    expect(jaccard(new Set(), new Set(["a"]))).toBe(0);
  });
});

describe("hostOf", () => {
  it("lowercases and strips www", () => {
    expect(hostOf("https://WWW.Example.com/path")).toBe("example.com");
  });

  it("returns empty string for a malformed URL", () => {
    expect(hostOf("not a url")).toBe("");
  });
});

describe("analyzeIndependence", () => {
  it("groups a syndicated reprint with its original", () => {
    const results = analyzeIndependence([
      { url: "https://wire.example/story", content: WIRE },
      { url: "https://outlet.example/story", content: WIRE_REPRINT },
      { url: "https://other.example/mortgages", content: INDEPENDENT },
    ]);

    // The wire story and its reprint are one claim, not two confirmations.
    expect(results[0]?.cluster).toBe(results[1]?.cluster);
    expect(results[2]?.cluster).not.toBe(results[0]?.cluster);
    expect(countIndependent(results)).toBe(2);
  });

  it("marks exactly one primary per cluster and counts the rest", () => {
    const results = analyzeIndependence([
      { url: "https://a.example/x", content: WIRE },
      { url: "https://b.example/x", content: WIRE_REPRINT },
      { url: "https://c.example/y", content: INDEPENDENT },
    ]);

    expect(results[0]?.primary).toBe(true);
    expect(results[1]?.primary).toBe(false);
    expect(results[0]?.duplicates).toBe(1);
    expect(results[1]?.duplicates).toBe(1);
    expect(results[2]?.primary).toBe(true);
    expect(results[2]?.duplicates).toBe(0);
  });

  it("treats two pages from the same host as one source", () => {
    const results = analyzeIndependence([
      { url: "https://blog.example/post-1", content: WIRE },
      { url: "https://blog.example/post-2", content: INDEPENDENT },
    ]);

    // One site publishing twice is not two independent confirmations.
    expect(countIndependent(results)).toBe(1);
  });

  it("ignores a leading www when comparing hosts", () => {
    const results = analyzeIndependence([
      { url: "https://example.com/a", content: WIRE },
      { url: "https://www.example.com/b", content: INDEPENDENT },
    ]);

    expect(countIndependent(results)).toBe(1);
  });

  it("clusters transitively", () => {
    const middle = `${WIRE} ${INDEPENDENT}`;
    const results = analyzeIndependence([
      { url: "https://a.example/1", content: WIRE },
      { url: "https://b.example/2", content: middle },
      { url: "https://c.example/3", content: `${middle} tail text here now` },
    ]);

    expect(new Set(results.map((r) => r.cluster)).size).toBeLessThan(3);
  });

  it("keeps genuinely different articles independent", () => {
    const results = analyzeIndependence([
      { url: "https://a.example/1", content: WIRE },
      { url: "https://b.example/2", content: INDEPENDENT },
    ]);

    expect(countIndependent(results)).toBe(2);
    expect(results.every((r) => r.primary)).toBe(true);
  });

  it("does not collapse documents too short to fingerprint", () => {
    const results = analyzeIndependence([
      { url: "https://a.example/1", content: "short text" },
      { url: "https://b.example/2", content: "other words" },
    ]);

    expect(countIndependent(results)).toBe(2);
  });

  it("handles an empty input", () => {
    expect(analyzeIndependence([])).toEqual([]);
    expect(countIndependent([])).toBe(0);
  });

  it("uses a threshold in the documented range", () => {
    expect(DUPLICATE_THRESHOLD).toBeGreaterThan(0);
    expect(DUPLICATE_THRESHOLD).toBeLessThan(1);
  });
});

describe("content duplication versus shared host", () => {
  it("marks a syndicated reprint as a content duplicate", () => {
    const results = analyzeIndependence([
      { url: "https://wire.example/story", content: WIRE },
      { url: "https://outlet.example/story", content: WIRE_REPRINT },
    ]);

    expect(results[1]?.contentDuplicate).toBe(true);
  });

  it("does not mark a second article on the same host as a duplicate", () => {
    // Same host means one account for counting corroboration, but the pages
    // are different writing. Treating the second as a reprint discarded it
    // wholesale, which lost the page that answered a benchmark question.
    const results = analyzeIndependence([
      { url: "https://site.example/a", content: WIRE },
      { url: "https://site.example/b", content: INDEPENDENT },
    ]);

    expect(results[1]?.primary).toBe(false);
    expect(results[1]?.contentDuplicate).toBe(false);
    // Still one independent account for corroboration purposes.
    expect(countIndependent(results)).toBe(1);
  });

  it("never marks a primary as a content duplicate", () => {
    const results = analyzeIndependence([
      { url: "https://a.example/1", content: WIRE },
      { url: "https://b.example/2", content: WIRE_REPRINT },
    ]);

    expect(results[0]?.contentDuplicate).toBe(false);
  });
});
