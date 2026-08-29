import { describe, expect, it } from "vitest";

import { extractMetadata } from "./metadata.js";

const METADATA_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>My Page Title</title>
  <meta name="description" content="A fallback description">
  <meta property="og:description" content="The OpenGraph description">
  <meta property="og:site_name" content="Example Site">
  <meta property="article:published_time" content="2024-03-01T10:00:00Z">
  <meta property="article:author" content="Jane Doe">
</head>
<body></body>
</html>`;

describe("extractMetadata", () => {
  it("extracts title, description, published, author, and siteName", () => {
    const meta = extractMetadata(METADATA_HTML);

    expect(meta.title).toBe("My Page Title");
    expect(meta.description).toBe("The OpenGraph description");
    expect(meta.published).toBe("2024-03-01T10:00:00Z");
    expect(meta.author).toBe("Jane Doe");
    expect(meta.siteName).toBe("Example Site");
  });

  it("falls back to meta description when og:description is absent", () => {
    const html = `<head><meta name="description" content="fallback"></head>`;
    const meta = extractMetadata(html);

    expect(meta.description).toBe("fallback");
  });

  it("returns empty strings for a document with no metadata", () => {
    const meta = extractMetadata("<html><body><p>hi</p></body></html>");

    expect(meta).toEqual({
      title: "",
      description: "",
      published: "",
      author: "",
      siteName: "",
    });
  });

  it("returns empty strings for empty html without throwing", () => {
    const meta = extractMetadata("");

    expect(meta.title).toBe("");
    expect(meta.description).toBe("");
  });
});
