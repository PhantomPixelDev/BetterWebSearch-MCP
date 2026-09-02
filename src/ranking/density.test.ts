import { describe, expect, it } from "vitest";

import { densitySignals, informationDensity } from "./density.js";

/** A substantial prose page: the kind of source worth ranking highly. */
const ARTICLE = [
  "Write-ahead logging changes how SQLite commits a transaction. Instead of",
  "writing the original content into a rollback journal and then modifying the",
  "database file, the new content is appended to a separate WAL file and the",
  "database itself is left untouched until a checkpoint occurs.",
  "",
  "The practical effect is that readers no longer block writers, because a",
  "reader continues to see the database as it stood when its transaction began",
  "while a writer appends to the log. This is the main reason WAL is preferred",
  "for workloads with concurrent reads.",
  "",
  "There are costs. All processes using the database must live on the same host,",
  "since WAL relies on shared memory, and very large transactions can leave the",
  "log file bigger than the database until a checkpoint runs.",
].join("\n");

/** A listicle: heavy navigation, repeated filler, little substance. */
const CONTENT_FARM = [
  "[Home](/) [Menu](/menu) [Search](/search) [Subscribe](/sub) [Login](/login)",
  "",
  "Top 17 Best Databases in 2026",
  "",
  "[Read more](/a) [Read more](/b) [Read more](/c) [Read more](/d)",
  "",
  "Databases are important for many businesses today.",
  "",
  "Databases are important for many businesses today.",
  "",
  "Databases are important for many businesses today.",
  "",
  "[Buy now](/x) [Buy now](/y) [Buy now](/z) [Compare](/c) [Deals](/d)",
  "",
  "Advertisement",
  "Sponsored",
  "Related Articles",
  "Follow us",
  "Privacy Policy",
  "All rights reserved",
].join("\n");

describe("densitySignals", () => {
  it("counts words without letting link targets inflate the total", () => {
    const signals = densitySignals("[click here](https://example.com/a/very/long/path) text");

    // "click here text" is three words; the URL must not be counted.
    expect(signals.words).toBe(3);
  });

  it("reports links per hundred words", () => {
    const signals = densitySignals(CONTENT_FARM);
    expect(signals.linkRatio).toBeGreaterThan(0);
  });

  it("detects repeated paragraphs", () => {
    const signals = densitySignals(CONTENT_FARM);
    expect(signals.duplicateRatio).toBeGreaterThan(0);
  });

  it("finds no duplicates in ordinary prose", () => {
    expect(densitySignals(ARTICLE).duplicateRatio).toBe(0);
  });

  it("flags navigation furniture as boilerplate", () => {
    const signals = densitySignals(CONTENT_FARM);
    expect(signals.boilerplateRatio).toBeGreaterThan(0.3);
  });

  it("returns zeroed signals for empty content", () => {
    const signals = densitySignals("");
    expect(signals.words).toBe(0);
    expect(signals.linkRatio).toBe(0);
    expect(signals.duplicateRatio).toBe(0);
    expect(signals.boilerplateRatio).toBe(0);
  });
});

describe("informationDensity", () => {
  it("scores substantial prose above a content farm", () => {
    const article = informationDensity(ARTICLE);
    const farm = informationDensity(CONTENT_FARM);

    expect(article.score).toBeGreaterThan(farm.score);
  });

  it("gives prose a high score", () => {
    expect(informationDensity(ARTICLE).score).toBeGreaterThan(0.7);
  });

  it("penalises a listicle clearly", () => {
    expect(informationDensity(CONTENT_FARM).score).toBeLessThan(0.5);
  });

  it("scores empty content 0", () => {
    expect(informationDensity("").score).toBe(0);
  });

  it("keeps the score within 0..1 for any input", () => {
    for (const input of ["", "x", ARTICLE, CONTENT_FARM, "[a](b) ".repeat(400)]) {
      const { score } = informationDensity(input);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    }
  });

  it("does not zero an otherwise substantial page for one bad signal", () => {
    // A legitimate reference page can be link-heavy. The score should drop,
    // not collapse, or good documentation would be ranked out.
    const linkHeavyReference = `${ARTICLE}\n\n${"[see also](/x) ".repeat(30)}`;
    const score = informationDensity(linkHeavyReference).score;

    expect(score).toBeLessThan(informationDensity(ARTICLE).score);
    expect(score).toBeGreaterThan(0.4);
  });

  it("exposes the signals behind the score", () => {
    const result = informationDensity(ARTICLE);

    expect(result).toHaveProperty("words");
    expect(result).toHaveProperty("linkRatio");
    expect(result).toHaveProperty("duplicateRatio");
    expect(result).toHaveProperty("boilerplateRatio");
    expect(result).toHaveProperty("meanSentenceWords");
  });
});
