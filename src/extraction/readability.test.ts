import { describe, expect, it } from "vitest";

import { extractWithReadability } from "./readability.js";

const ARTICLE_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>Test Article</title>
  <meta name="author" content="Jane Doe">
</head>
<body>
  <nav><a href="/">Home</a></nav>
  <script>var evil = "should be stripped";</script>
  <style>.hidden { display: none; }</style>
  <article>
    <h1>Test Article</h1>
    <p>This is the first paragraph of a genuinely readable article. It contains
    enough text to satisfy the readability heuristic and be parsed into a
    standalone article object.</p>
    <p>A second paragraph with more substantive content about the topic at
    hand, adding further length so the article clearly exceeds the minimum
    threshold required for extraction.</p>
    <p>And a third paragraph rounding out the body with additional detail and
    context, ensuring the extracted markdown is comfortably long.</p>
  </article>
  <footer>Copyright</footer>
</body>
</html>`;

describe("extractWithReadability", () => {
  it("extracts title, markdown, text, excerpt, length, and byline", () => {
    const result = extractWithReadability(ARTICLE_HTML, "https://example.com/a");

    expect(result).not.toBeNull();
    expect(result?.title).toBe("Test Article");
    expect(result?.contentMarkdown).toContain("first paragraph");
    expect(result?.textContent).toContain("first paragraph");
    expect(result?.length).toBeGreaterThan(100);
    expect(result?.excerpt).toBeTruthy();
  });

  it("strips script and style content from the output", () => {
    const result = extractWithReadability(ARTICLE_HTML, "https://example.com/a");

    expect(result?.contentMarkdown).not.toContain("should be stripped");
    expect(result?.contentMarkdown).not.toContain(".hidden");
  });

  it("returns null for a page with no readable article", () => {
    const result = extractWithReadability(
      "<html><body><p>tiny</p></body></html>",
      "https://example.com/",
    );

    expect(result).toBeNull();
  });

  it("returns null for empty html without throwing", () => {
    const result = extractWithReadability("", "https://example.com/");

    expect(result).toBeNull();
  });
});
