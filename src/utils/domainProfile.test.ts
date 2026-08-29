import { describe, expect, it } from "vitest";

import { detectFramework, profileFor } from "./domainProfile.js";
import type { ExtractionResult } from "./domainProfile.js";

describe("detectFramework", () => {
  it("detects Next.js Pages Router from __NEXT_DATA__", () => {
    const html = `<script id="__NEXT_DATA__">{"props":{}}</script>`;

    expect(detectFramework(html)).toBe("Next.js:Pages");
  });

  it("detects Next.js App Router from self.__next_f", () => {
    const html = `<script>self.__next_f.push([1,"chunk"])</script>`;

    expect(detectFramework(html)).toBe("Next.js:App");
  });

  it("detects Nuxt from __NUXT__", () => {
    const html = `<script>window.__NUXT__={"data":[]}</script>`;

    expect(detectFramework(html)).toBe("Nuxt");
  });

  it("returns unknown for plain HTML", () => {
    expect(detectFramework("<html><body>Hello</body></html>")).toBe("unknown");
  });

  it("returns unknown for empty html", () => {
    expect(detectFramework("")).toBe("unknown");
  });
});

describe("profileFor", () => {
  const baseResult: ExtractionResult = {
    hasJsonLd: false,
    apiPatterns: [],
    bestMethod: "readability",
  };

  it("marks requires_js true when stripped text is shorter than 500 chars", () => {
    const profile = profileFor("example.com", "<html><p>tiny</p></html>", baseResult);

    expect(profile.requires_js).toBe(true);
  });

  it("marks requires_js false when stripped text is at least 500 chars", () => {
    const longText = "<p>" + "word ".repeat(200) + "</p>";
    const profile = profileFor("example.com", longText, baseResult);

    expect(profile.requires_js).toBe(false);
  });

  it("ignores script and style content when measuring text length", () => {
    const html =
      "<script>var huge = '" + "x".repeat(1000) + "';</script><p>short</p>";
    const profile = profileFor("example.com", html, baseResult);

    expect(profile.requires_js).toBe(true);
  });

  it("detects framework and JSON-LD from the html and result", () => {
    const html = `<script id="__NEXT_DATA__">{"props":{}}</script>`;
    const profile = profileFor("example.com", html, {
      hasJsonLd: true,
      apiPatterns: ["/api/products/*"],
      bestMethod: "hydration_data",
    });

    expect(profile.framework).toBe("Next.js:Pages");
    expect(profile.has_json_ld).toBe(true);
  });

  it("reports has_json_ld false when the result says none was found", () => {
    const profile = profileFor("example.com", "<html><p>plain</p></html>", baseResult);

    expect(profile.has_json_ld).toBe(false);
  });

  it("carries the discovered api_patterns through", () => {
    const profile = profileFor("example.com", "<html></html>", {
      hasJsonLd: false,
      apiPatterns: ["/api/a", "/api/b"],
      bestMethod: "browser_api_intercept",
    });

    expect(profile.api_patterns).toEqual(["/api/a", "/api/b"]);
  });

  it("records the best_method from the extraction result", () => {
    const profile = profileFor("example.com", "<html></html>", {
      hasJsonLd: false,
      apiPatterns: [],
      bestMethod: "hydration_data",
    });

    expect(profile.best_method).toBe("hydration_data");
  });
});
