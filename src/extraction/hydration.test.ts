import { describe, expect, it } from "vitest";

import {
  MAX_HYDRATION_CHARS,
  hydrationText,
  isReadableString,
  stripTags,
} from "./hydration.js";

/** A payload shaped like the ones Next.js sites ship. */
const PAYLOAD = {
  props: {
    pageProps: {
      post: {
        id: 1718817,
        slug: "what-is-http-etag",
        status: "fulfilled",
        url: "https://example.com/computer-networks/what-is-http-etag/",
        content:
          "<h3>ETag</h3>\r\n<p>An entity tag is an HTTP header used for Web " +
          "cache validation and conditional requests from browsers.</p>",
        author: { name: "A Writer", avatar: "data:image/png;base64,AAAABBBB" },
        tags: ["http", "etag", "caching"],
        description:
          "Learn what an HTTP ETag is and how conditional requests use " +
          "If-None-Match to revalidate cached resources efficiently.",
      },
    },
  },
};

describe("stripTags", () => {
  it("removes markup and collapses whitespace", () => {
    expect(stripTags("<p>Hello   <b>world</b></p>\n\n")).toBe("Hello world");
  });

  it("drops script and style bodies entirely", () => {
    expect(stripTags("<script>var x = 1;</script>text")).toBe("text");
    expect(stripTags("<style>.a{color:red}</style>text")).toBe("text");
  });

  it("decodes the entities that appear in extracted content", () => {
    expect(stripTags("a&nbsp;b &amp; c &lt;d&gt; &quot;e&quot; &#39;f&#39;")).toBe(
      `a b & c <d> "e" 'f'`,
    );
  });
});

describe("isReadableString", () => {
  it("accepts a sentence", () => {
    expect(
      isReadableString(
        "An entity tag is an HTTP header used for cache validation.",
      ),
    ).toBe(true);
  });

  it.each([
    ["short text here", "too short"],
    ["https://example.com/a/very/long/path/that/goes/on/forever/x", "a URL"],
    ["/computer-networks/what-is-http-etag/", "a path"],
    ["what-is-http-etag-and-how-does-it-work-in-modern-browsers", "a slug"],
    ["QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5eg==", "base64"],
  ])("rejects %j (%s)", (value) => {
    expect(isReadableString(value)).toBe(false);
  });
});

describe("hydrationText", () => {
  it("returns the prose and none of the payload machinery", () => {
    const text = hydrationText(PAYLOAD);

    expect(text).toContain("An entity tag is an HTTP header");
    expect(text).toContain("If-None-Match");
    // The whole point: no braces, keys, slugs, ids, URLs or base64.
    expect(text).not.toContain("pageProps");
    expect(text).not.toContain("what-is-http-etag");
    expect(text).not.toContain("base64");
    expect(text).not.toContain("{");
  });

  it("is far smaller than serializing the payload", () => {
    // Serializing was the old behaviour and returned 77KB pages.
    expect(hydrationText(PAYLOAD).length).toBeLessThan(
      JSON.stringify(PAYLOAD).length / 2,
    );
  });

  it("drops strings repeated under several keys", () => {
    const sentence =
      "An entity tag is an HTTP header used for cache validation and revalidation.";
    const text = hydrationText({ a: sentence, b: sentence, c: { d: sentence } });

    expect(text).toBe(sentence);
  });

  it("caps the total so one page cannot flood a response", () => {
    const long = `${"This is a readable sentence about caching. ".repeat(40)}`;
    const many = Array.from({ length: 400 }, (_, i) => `${long} variant ${i}`);

    expect(hydrationText(many).length).toBeLessThanOrEqual(
      MAX_HYDRATION_CHARS + long.length,
    );
  });

  it("handles empty and non-object input", () => {
    expect(hydrationText(undefined)).toBe("");
    expect(hydrationText(null)).toBe("");
    expect(hydrationText(42)).toBe("");
    expect(hydrationText({})).toBe("");
    expect(hydrationText([])).toBe("");
  });

  it("does not recurse without bound on a deep payload", () => {
    let deep: unknown = "A readable sentence sitting far below the surface.";
    for (let i = 0; i < 60; i += 1) {
      deep = { nested: deep };
    }

    expect(() => hydrationText(deep)).not.toThrow();
  });

  it("survives a cyclic payload", () => {
    const cyclic: Record<string, unknown> = {
      text: "An entity tag is an HTTP header used for cache validation here.",
    };
    cyclic.self = cyclic;

    expect(() => hydrationText(cyclic)).not.toThrow();
    expect(hydrationText(cyclic)).toContain("entity tag");
  });
});
