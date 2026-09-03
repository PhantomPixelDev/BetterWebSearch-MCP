import { describe, expect, it } from "vitest";

import {
  MAX_PASSAGE_CHARS,
  expandsAcronym,
  findAcronyms,
  isDefinitionQuery,
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

  it("windows an over-long block instead of emitting the whole page", () => {
    // A page with no blank lines used to become a single passage containing
    // the entire document, so a cited "passage" was the whole page.
    const long = "word ".repeat(2000).trim();
    const passages = splitPassages(long);

    expect(passages.length).toBeGreaterThan(1);
    for (const passage of passages) {
      expect(passage.text.length).toBeLessThanOrEqual(MAX_PASSAGE_CHARS);
    }
  });

  it("never cuts a word in half when windowing", () => {
    const long = `${"alpha beta gamma delta ".repeat(200)}`.trim();

    // Every token must still be a whole word from the source vocabulary; a
    // mid-word cut would produce fragments like "gam" or "elta".
    for (const passage of splitPassages(long)) {
      for (const word of passage.text.split(/\s+/)) {
        expect(["alpha", "beta", "gamma", "delta"]).toContain(word);
      }
    }
  });

  it("keeps windowed offsets addressing the source", () => {
    const long = `${"Sentence number one here. ".repeat(150)}`.trim();

    for (const passage of splitPassages(long)) {
      expect(long.slice(passage.start, passage.end).trim()).toBe(passage.text);
    }
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


describe("findAcronyms", () => {
  it("picks uppercase tokens out of a query", () => {
    expect(findAcronyms("What does TLS stand for?")).toEqual(["TLS"]);
  });

  it("ignores tokens shorter than three letters", () => {
    expect(findAcronyms("What is AI?")).toEqual([]);
  });

  it("deduplicates", () => {
    expect(findAcronyms("TLS versus TLS")).toEqual(["TLS"]);
  });
});

describe("expandsAcronym", () => {
  it.each([
    ["TLS", "Transport Layer Security"],
    ["ACID", "Atomicity, Consistency, Isolation, Durability"],
    ["WAL", "Write-ahead logging"],
    ["CRUD", "Create, read, update and delete"],
    ["HTML", "HyperText Markup Language"],
    ["HTML", "Hypertext Markup Language"],
    ["CORS", "Cross-Origin Resource Sharing"],
    ["SSRF", "Server-side request forgery"],
    ["SQL", "Structured Query Language"],
    ["DNS", "Domain Name System"],
    ["CSS", "Cascading Style Sheets"],
    ["JWT", "JSON Web Token"],
    ["REST", "Representational State Transfer"],
  ])("expands %s from %j", (acronym, text) => {
    expect(expandsAcronym(text, acronym)).toBe(true);
  });

  it("does not treat the bare acronym as its own expansion", () => {
    // Every gap in the pattern may be empty, so "TLS" matches T[a-z]*L[a-z]*S.
    // Without a length floor the bonus would apply to any passage mentioning
    // the acronym and rank nothing.
    expect(expandsAcronym("TLS is enabled on this server.", "TLS")).toBe(false);
  });

  it("ignores acronyms shorter than three letters", () => {
    expect(expandsAcronym("Artificial Intelligence", "AI")).toBe(false);
  });
});

describe("acronym expansion ranking", () => {
  const SPAM = "TLS is enabled on this server. ".repeat(30);
  const MORE = "Configure TLS ciphers carefully. ".repeat(30);
  const ANSWER =
    "TLS stands for Transport Layer Security, a cryptographic protocol " +
    "that secures data in transit between two applications.";
  const PAGE = `${SPAM}\n\n${MORE}\n\n${ANSWER}`;

  it("surfaces the defining sentence over passages that merely repeat it", () => {
    // The answer states the expansion once while the rest repeat the acronym,
    // so plain BM25 ranked the answer last. This was a measured 58% retention
    // for acronym questions in the benchmark.
    const [best] = selectPassages(PAGE, "What does TLS stand for?", 1);

    expect(best?.text).toMatch(/Transport Layer Security/i);
  });

  it("leaves non-acronym queries alone", () => {
    const page = `The capital of France is Paris.\n\n${"Filler about weather. ".repeat(20)}`;
    const [best] = selectPassages(page, "What is the capital of France?", 1);

    expect(best?.text).toContain("Paris");
  });

  it("does not reward unrelated prose that accidentally fits the initials", () => {
    // "The lazy squirrel" spells TLS, but the passage never names the acronym.
    const prose = "The lazy squirrel ate a nut. ".repeat(20);

    expect(selectPassages(prose, "What does TLS stand for?", 1)).toEqual([]);
  });
});


describe("isDefinitionQuery", () => {
  it.each([
    "What does TLS stand for?",
    "What do the letters ACID stand for",
    "CORS is short for what",
    "What is the DNS abbreviation",
    "Is REST an acronym",
  ])("recognises %j", (query) => {
    expect(isDefinitionQuery(query)).toBe(true);
  });

  it.each([
    "How does DNS caching work?",
    "Configure TLS ciphers on nginx",
    "Why is CSS specificity confusing",
  ])("does not fire on %j", (query) => {
    // Promoting a definition passage here would bury the answer wanted.
    expect(isDefinitionQuery(query)).toBe(false);
  });
});

describe("expandsAcronym strictness", () => {
  it("does not match a heading that merely repeats the acronym", () => {
    // Under the i flag [a-z]* also consumes uppercase, so this heading once
    // satisfied D-N-S. Every passage on an acronym page then looked like an
    // expansion and promoting expansions reordered nothing.
    const heading = "## DNS definition: What does DNS stand for in networking";

    expect(expandsAcronym(heading, "DNS")).toBe(false);
  });

  it("does not match the acronym used in a sentence", () => {
    expect(expandsAcronym("CSS is a stylesheet language.", "CSS")).toBe(false);
    expect(expandsAcronym("TLS is enabled on this server.", "TLS")).toBe(false);
  });

  it("requires each initial to begin a real word", () => {
    // "DNS" alone has no lowercase continuation after any initial.
    expect(expandsAcronym("DNS", "DNS")).toBe(false);
  });
});

describe("definition-query promotion", () => {
  const PAGE = [
    "## DNS definition: What does DNS stand for in networking",
    "",
    "The DNS system resolves names. ".repeat(20),
    "",
    "DNS stands for Domain Name System, the naming scheme used on the internet.",
  ].join("\n\n");

  it("puts the defining sentence ahead of higher-scoring headings", () => {
    // The heading carries every query term and outscores the answer, and
    // callers keep only the top passages per page, so without promotion the
    // answer was never a candidate. This was 6/12 acronym retention.
    const [best] = selectPassages(PAGE, "What does DNS stand for?", 1);

    expect(best?.text).toMatch(/Domain Name System/);
  });

  it("leaves a non-definition query on the same page ranked by relevance", () => {
    const [best] = selectPassages(PAGE, "How does the DNS system resolve names?", 1);

    expect(best?.text).not.toMatch(/^DNS stands for/);
  });
});
