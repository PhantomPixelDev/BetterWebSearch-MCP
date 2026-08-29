import { describe, expect, it } from "vitest";
import { domainScore } from "./domainScore.js";

describe("domainScore", () => {
  it("scores wikipedia.org high", () => {
    expect(domainScore("https://en.wikipedia.org/wiki/Foo")).toBeGreaterThan(0.8);
  });

  it("scores arxiv.org high", () => {
    expect(domainScore("https://arxiv.org/abs/1234")).toBeGreaterThan(0.8);
  });

  it("scores developer.mozilla.org high", () => {
    expect(domainScore("https://developer.mozilla.org/en-US/docs/Web")).toBeGreaterThan(
      0.8,
    );
  });

  it("scores stackoverflow.com high", () => {
    expect(domainScore("https://stackoverflow.com/questions/1")).toBeGreaterThan(0.8);
  });

  it("scores medium news/tech at medium tier", () => {
    expect(domainScore("https://medium.com/@user/post")).toBeCloseTo(0.7, 5);
  });

  it("scores unknown domains at default", () => {
    expect(domainScore("https://some-random-site.example.com/x")).toBeCloseTo(0.5, 5);
  });

  it("scores spammy domains low", () => {
    expect(domainScore("https://pinterest.com/pin/1")).toBeLessThan(0.4);
  });

  it("matches subdomains by suffix", () => {
    expect(domainScore("https://www.wikipedia.org/wiki/Foo")).toBeGreaterThan(0.8);
    expect(domainScore("https://sub.stackoverflow.com/q/1")).toBeGreaterThan(0.8);
  });

  it("accepts a bare hostname", () => {
    expect(domainScore("wikipedia.org")).toBeGreaterThan(0.8);
  });

  it("returns default for empty or malformed input", () => {
    expect(domainScore("")).toBeCloseTo(0.5, 5);
    expect(domainScore("not a url")).toBeCloseTo(0.5, 5);
  });
});
