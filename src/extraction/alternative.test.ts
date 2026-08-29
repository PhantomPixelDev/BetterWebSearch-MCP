import { describe, expect, it, vi } from "vitest";

import {
  buildAlternativeUrls,
  buildSearchQueries,
  findAlternativeSources,
  MAX_SNIPPETS,
  SNIPPET_CONFIDENCE,
} from "./alternative.js";
import type { AlternativeDeps } from "./alternative.js";
import type { FetchedPage } from "./fetch.js";
import type { SearchResult } from "../providers/types.js";
import { Cache } from "../utils/cache.js";

/** A blocked (403) page fixture. */
function blockedPage(url: string): FetchedPage {
  return {
    html: "",
    headers: { "content-type": "text/html" },
    status: 403,
    url,
  };
}

/** A usable (200) page fixture. */
function okPage(url: string): FetchedPage {
  return {
    html: "<html><body><article><p>full article text</p></article></body></html>",
    headers: { "content-type": "text/html" },
    status: 200,
    url,
  };
}

/** A search result fixture. */
const SNIPPET: SearchResult = {
  title: "Syndicated copy",
  url: "https://syndicated.example/article",
  snippet: "The full article text appears here.",
  source: "duckduckgo",
};

describe("buildAlternativeUrls", () => {
  it("returns original, ?output=1, /amp, and ?amp variants", () => {
    expect(buildAlternativeUrls("https://example.com/article")).toEqual([
      "https://example.com/article",
      "https://example.com/article?output=1",
      "https://example.com/article/amp",
      "https://example.com/article?amp",
    ]);
  });

  it("uses & when the URL already has a query string", () => {
    expect(buildAlternativeUrls("https://example.com/article?id=7")).toEqual([
      "https://example.com/article?id=7",
      "https://example.com/article?id=7&output=1",
      "https://example.com/article/amp?id=7",
      "https://example.com/article?id=7&amp",
    ]);
  });

  it("returns the original URL when it cannot be parsed", () => {
    expect(buildAlternativeUrls("not a url")).toEqual(["not a url"]);
  });
});

describe("buildSearchQueries", () => {
  it("quotes the title and adds a site-restricted query", () => {
    expect(
      buildSearchQueries("https://example.com/article", "My Article"),
    ).toEqual([
      '"My Article"',
      'site:example.com "My Article"',
      "My Article example.com",
    ]);
  });

  it("falls back to a bare site query when the title is null", () => {
    expect(buildSearchQueries("https://example.com/article", null)).toEqual([
      "site:example.com",
    ]);
  });
});

describe("findAlternativeSources", () => {
  it("returns snippet evidence when every URL variant is blocked", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValue(blockedPage("https://example.com/article"));
    const aggregateSearch = vi.fn().mockResolvedValue([SNIPPET]);
    const deps: AlternativeDeps = { fetchPage, aggregateSearch };

    const evidence = await findAlternativeSources(
      "https://example.com/article",
      "My Article",
      deps,
    );

    expect(fetchPage).toHaveBeenCalledTimes(4);
    expect(evidence).toHaveLength(1);
    expect(evidence[0]).toEqual({
      source: "search_snippet",
      type: "search_snippet",
      confidence: SNIPPET_CONFIDENCE,
      url: "https://syndicated.example/article",
      snippet: "The full article text appears here.",
    });
  });

  it("returns page evidence when an AMP variant succeeds", async () => {
    const fetchPage = vi.fn().mockImplementation(async (url: string) => {
      return url.includes("/amp") ? okPage(url) : blockedPage(url);
    });
    const aggregateSearch = vi.fn();
    const deps: AlternativeDeps = { fetchPage, aggregateSearch };

    const evidence = await findAlternativeSources(
      "https://example.com/article",
      "My Article",
      deps,
    );

    expect(aggregateSearch).not.toHaveBeenCalled();
    expect(evidence).toHaveLength(1);
    expect(evidence[0]).toMatchObject({
      source: "page",
      type: "page",
      url: "https://example.com/article/amp",
    });
  });

  it("uses a cached variant without fetching it", async () => {
    const cache = new Cache({ memory: true });
    cache.setPage(
      "https://example.com/article/amp",
      "cached amp content",
      "http_fetch",
      0.85,
    );
    const fetchPage = vi
      .fn()
      .mockResolvedValue(blockedPage("https://example.com/article"));
    const aggregateSearch = vi.fn();
    const deps: AlternativeDeps = { fetchPage, aggregateSearch, cache };

    const evidence = await findAlternativeSources(
      "https://example.com/article",
      "My Article",
      deps,
    );

    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(aggregateSearch).not.toHaveBeenCalled();
    expect(evidence).toHaveLength(1);
    expect(evidence[0]).toMatchObject({
      source: "page",
      url: "https://example.com/article/amp",
      confidence: 0.85,
    });
  });

  it("generates a site fallback query when the title is null", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValue(blockedPage("https://example.com/article"));
    const aggregateSearch = vi.fn().mockResolvedValue([SNIPPET]);
    const deps: AlternativeDeps = { fetchPage, aggregateSearch };

    await findAlternativeSources("https://example.com/article", null, deps);

    expect(aggregateSearch).toHaveBeenCalledWith("site:example.com", {
      count: MAX_SNIPPETS,
    });
  });

  it("returns [] when the search is empty instead of throwing", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValue(blockedPage("https://example.com/article"));
    const aggregateSearch = vi.fn().mockResolvedValue([]);
    const deps: AlternativeDeps = { fetchPage, aggregateSearch };

    const evidence = await findAlternativeSources(
      "https://example.com/article",
      "My Article",
      deps,
    );

    expect(evidence).toEqual([]);
  });

  it("returns [] when the search provider throws", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValue(blockedPage("https://example.com/article"));
    const aggregateSearch = vi.fn().mockRejectedValue(new Error("provider down"));
    const deps: AlternativeDeps = { fetchPage, aggregateSearch };

    const evidence = await findAlternativeSources(
      "https://example.com/article",
      "My Article",
      deps,
    );

    expect(evidence).toEqual([]);
  });
});