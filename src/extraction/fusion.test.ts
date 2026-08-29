import { describe, expect, it } from "vitest";

import { fuseContent } from "./fusion.js";
import type { StrategyResult } from "./evidence.js";

describe("fuseContent", () => {
  it("picks the api strategy over readability by confidence", () => {
    const strategies: StrategyResult[] = [
      {
        method: "readability",
        confidence: 0.85,
        content: "Readability body text that is long enough to be useful.",
      },
      {
        method: "api",
        confidence: 0.99,
        content: "API body text with the richest detail.",
        api_endpoints: [{ url: "/api/products/1", data: { name: "Widget" } }],
      },
    ];

    const fused = fuseContent("https://example.com/p", "Example", strategies);

    expect(fused.extraction.method).toBe("api");
    expect(fused.extraction.confidence).toBe(0.99);
    expect(fused.extraction.rendered).toBe(true);
    expect(fused.content).toBe("API body text with the richest detail.");
  });

  it("uses the method baseline when the strategy supplies no confidence", () => {
    const strategies: StrategyResult[] = [
      { method: "jsonld", confidence: 0, content: "JSON-LD content" },
      { method: "metadata", confidence: 0, content: "Metadata content" },
    ];

    const fused = fuseContent("https://example.com/p", "T", strategies);

    expect(fused.extraction.method).toBe("jsonld");
    expect(fused.extraction.confidence).toBe(0.95);
  });

  it("merges structured data and api endpoints from every strategy", () => {
    const strategies: StrategyResult[] = [
      {
        method: "readability",
        confidence: 0.85,
        content: "Readability wins the body.",
        structured_data: [{ "@type": "Article", headline: "A" }],
      },
      {
        method: "api",
        confidence: 0.99,
        content: "API body",
        api_endpoints: [{ url: "/api/a", data: 1 }],
      },
      {
        method: "jsonld",
        confidence: 0.95,
        content: "JSON-LD body",
        structured_data: [{ "@type": "Product", name: "B" }],
        api_endpoints: [{ url: "/api/b", data: 2 }],
      },
    ];

    const fused = fuseContent("https://example.com/p", "T", strategies);

    expect(fused.structured_data).toEqual([
      { "@type": "Article", headline: "A" },
      { "@type": "Product", name: "B" },
    ]);
    expect(fused.api_endpoints).toEqual([
      { url: "/api/a", data: 1 },
      { url: "/api/b", data: 2 },
    ]);
  });

  it("marks rendered methods as rendered and non-rendered as not", () => {
    const rendered = fuseContent("https://example.com/p", "T", [
      { method: "rendered", confidence: 0.9, content: "Rendered body" },
    ]);
    expect(rendered.extraction.rendered).toBe(true);

    const plain = fuseContent("https://example.com/p", "T", [
      { method: "readability", confidence: 0.85, content: "Plain body" },
    ]);
    expect(plain.extraction.rendered).toBe(false);
  });

  it("returns empty content and readability fallback when no strategy has content", () => {
    const fused = fuseContent("https://example.com/p", "T", [
      { method: "api", confidence: 0.99, content: "   " },
    ]);

    expect(fused.content).toBe("");
    expect(fused.extraction.method).toBe("readability");
    expect(fused.extraction.confidence).toBe(0);
  });

  it("attaches the supplied metadata", () => {
    const fused = fuseContent("https://example.com/p", "T", [
      { method: "readability", confidence: 0.85, content: "Body" },
    ], { title: "T", description: "D" });

    expect(fused.metadata).toEqual({ title: "T", description: "D" });
    expect(fused.title).toBe("T");
  });
});
