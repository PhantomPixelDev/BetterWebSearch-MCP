import { describe, expect, it } from "vitest";

import {
  TARGET_PASSAGE_CHARS,
  rankPassages,
  selectPassages,
  splitPassages,
  tokenize,
} from "./passages.js";

/** Boilerplate long enough to fill the first 400 characters of a page. */
const BOILERPLATE =
  "We use cookies to improve your experience on this website. " +
  "By continuing to browse you agree to our terms of service and privacy policy. " +
  "Sign up for our newsletter to receive updates. Follow us on social media. " +
  "This site is operated by an independent publisher. All rights reserved. " +
  "Skip to main content. Navigation menu. Search the archives here.";

const ANSWER_PARAGRAPH =
  "The RTX 5090 delivers roughly 30 percent higher frame rates than the " +
  "RTX 4090 in rasterized workloads at 4K resolution, while drawing about " +
  "125 watts more power under sustained load.";

const PAGE = `${BOILERPLATE}\n\nSome unrelated filler about office hours and parking.\n\n${ANSWER_PARAGRAPH}\n\nMore unrelated footer text about careers and press enquiries.`;

describe("tokenize", () => {
  it("lowercases and drops stop words and single characters", () => {
    expect(tokenize("The Quick brown FOX a b")).toEqual(["quick", "brown", "fox"]);
  });

  it("keeps alphanumeric identifiers", () => {
    expect(tokenize("RTX 5090 vs rtx_4090")).toEqual([
      "rtx",
      "5090",
      "vs",
      "rtx_4090",
    ]);
  });

  it("returns nothing for punctuation only", () => {
    expect(tokenize("!!! ... ???")).toEqual([]);
  });
});

describe("splitPassages", () => {
  it("splits on blank lines and records offsets into the source", () => {
    // Each paragraph must exceed TARGET_PASSAGE_CHARS on its own, or the
    // packing rule below would legitimately merge them into one passage.
    const first = `First ${"alpha ".repeat(120)}`.trim();
    const second = `Second ${"beta ".repeat(120)}`.trim();
    const content = `${first}\n\n${second}`;
    const passages = splitPassages(content);

    expect(passages).toHaveLength(2);
    expect(passages[0]?.text).toBe(first);
    expect(passages[1]?.text).toBe(second);
    // Offsets must address the original string exactly.
    for (const passage of passages) {
      expect(content.slice(passage.start, passage.end)).toBe(passage.text);
    }
  });

  it("packs short paragraphs together rather than emitting them alone", () => {
    const content = "One.\n\nTwo.\n\nThree.";
    expect(splitPassages(content)).toHaveLength(1);
  });

  it("keeps an over-long paragraph whole instead of cutting mid-sentence", () => {
    const long = "word ".repeat(400).trim();
    const passages = splitPassages(long);

    expect(passages).toHaveLength(1);
    expect(passages[0]?.text.length).toBeGreaterThan(TARGET_PASSAGE_CHARS);
  });

  it("returns nothing for empty or whitespace-only content", () => {
    expect(splitPassages("")).toEqual([]);
    expect(splitPassages("   \n\n  \n")).toEqual([]);
  });
});

describe("rankPassages", () => {
  it("drops passages sharing no term with the query", () => {
    const passages = splitPassages("Alpha beta gamma.\n\nZebra quokka narwhal.");
    const ranked = rankPassages(passages, "alpha beta");

    expect(ranked).toHaveLength(1);
    expect(ranked[0]?.text).toContain("Alpha");
  });

  it("returns nothing when the query is only stop words", () => {
    expect(rankPassages(splitPassages("Some content here."), "the a of")).toEqual(
      [],
    );
  });

  it("handles empty input", () => {
    expect(rankPassages([], "query")).toEqual([]);
  });
});

describe("selectPassages", () => {
  it("finds the answer paragraph instead of the opening boilerplate", () => {
    const [best] = selectPassages(
      PAGE,
      "How much faster is the RTX 5090 than the RTX 4090?",
      1,
    );

    // The old implementation returned PAGE.slice(0, 400), which is entirely
    // cookie notice and navigation text.
    expect(best?.text).toContain("30 percent higher frame rates");
    expect(best?.text).not.toContain("cookies");
    expect(PAGE.slice(0, 400)).not.toContain("30 percent");
  });

  it("returns offsets that address the exact source span", () => {
    const [best] = selectPassages(PAGE, "RTX 5090 power draw", 1);

    expect(best).toBeDefined();
    expect(PAGE.slice(best?.start, best?.end).trim()).toBe(best?.text);
  });

  it("respects the requested limit", () => {
    expect(selectPassages(PAGE, "RTX 5090 4090 power", 2).length).toBeLessThanOrEqual(2);
  });

  it("returns nothing when no passage matches the question", () => {
    expect(selectPassages(PAGE, "quokka marsupial husbandry", 2)).toEqual([]);
  });

  it("scores passages in descending relevance", () => {
    const selected = selectPassages(PAGE, "RTX 5090 rasterized power", 3);
    const scores = selected.map((p) => p.score);

    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });
});
