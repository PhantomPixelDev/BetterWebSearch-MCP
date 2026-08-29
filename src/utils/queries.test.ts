import { describe, expect, it } from "vitest";
import { expandQueries } from "./queries.js";

describe("expandQueries", () => {
  it("includes the original question first", () => {
    const queries = expandQueries("cheapest unlimited mobile internet Germany");
    expect(queries[0]).toBe("cheapest unlimited mobile internet Germany");
  });

  it("returns 4-6 unique variants", () => {
    const queries = expandQueries("cheapest unlimited mobile internet Germany");
    expect(queries.length).toBeGreaterThanOrEqual(4);
    expect(queries.length).toBeLessThanOrEqual(6);
    expect(new Set(queries.map((q) => q.toLowerCase())).size).toBe(queries.length);
  });

  it("produces German translations for generic English queries", () => {
    const queries = expandQueries("cheapest unlimited mobile internet Germany");
    const joined = queries.join(" ").toLowerCase();
    expect(joined).toContain("unbegrenztes");
    expect(joined).toContain("deutschland");
  });

  it("produces synonym variants for cheap", () => {
    const queries = expandQueries("cheap laptop");
    const joined = queries.join(" ").toLowerCase();
    expect(joined).toContain("cheapest");
    expect(joined).toContain("affordable");
  });

  it("returns [''] for an empty question", () => {
    expect(expandQueries("")).toEqual([""]);
    expect(expandQueries("   ")).toEqual([""]);
  });

  it("does not duplicate the original when a replacement equals it", () => {
    const queries = expandQueries("unlimited mobile internet");
    const unique = new Set(queries.map((q) => q.toLowerCase()));
    expect(unique.size).toBe(queries.length);
  });
});
