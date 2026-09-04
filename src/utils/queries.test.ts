import { describe, expect, it } from "vitest";
import { expandQueries, variantKey } from "./queries.js";

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

describe("variantKey", () => {
  it("collapses case, punctuation and a trailing plural", () => {
    expect(variantKey("Type R review")).toBe(variantKey("type r reviews!"));
  });

  it("keeps genuinely different wording apart", () => {
    expect(variantKey("best framework")).not.toBe(variantKey("top framework"));
  });

  it("does not strip a short word ending in s", () => {
    // "is" and "i" must not collapse together.
    expect(variantKey("what is x")).toBe("what is x");
  });
});

describe("expandQueries deduplication", () => {
  it("does not emit a variant that differs only by plural", () => {
    // The expander used to return both "… Type R review" and "… reviews",
    // spending a provider call and a rank slot on the same search.
    const variants = expandQueries(
      "2005 Honda Civic EP specifications variants EP1 EP2 EP3 Type R review",
    );
    const keys = variants.map(variantKey);

    expect(new Set(keys).size).toBe(keys.length);
  });

  it("still expands genuinely distinct synonyms", () => {
    expect(expandQueries("best python web framework").length).toBeGreaterThan(1);
  });
});
