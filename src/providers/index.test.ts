import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SearchResult } from "./types.js";

// Shared mocks so every instance created by enabledProviders() uses the same
// search function, which the tests configure once.
const { braveSearch, tavilySearch, ddgSearch, serpapiSearch } = vi.hoisted(
  () => ({
    braveSearch: vi.fn(),
    tavilySearch: vi.fn(),
    ddgSearch: vi.fn(),
    serpapiSearch: vi.fn(),
  }),
);

vi.mock("./brave.js", () => ({
  BraveProvider: class {
    readonly name = "brave";
    search = braveSearch;
  },
}));
vi.mock("./tavily.js", () => ({
  TavilyProvider: class {
    readonly name = "tavily";
    search = tavilySearch;
  },
}));
vi.mock("./duckduckgo.js", () => ({
  DuckDuckGoProvider: class {
    readonly name = "duckduckgo";
    search = ddgSearch;
  },
}));
vi.mock("./serpapi.js", () => ({
  SerpApiProvider: class {
    readonly name = "serpapi";
    search = serpapiSearch;
  },
}));

import { aggregateSearch, enabledProviders } from "./index.js";

const braveResult: SearchResult = {
  title: "Brave hit",
  url: "https://brave.example",
  snippet: "brave snippet",
  source: "brave",
};
const ddgResult: SearchResult = {
  title: "DDG hit",
  url: "https://ddg.example",
  snippet: "ddg snippet",
  source: "duckduckgo",
};

describe("enabledProviders", () => {
  const originalBrave = process.env.BRAVE_API_KEY;
  const originalTavily = process.env.TAVILY_API_KEY;

  beforeEach(() => {
    process.env.BRAVE_API_KEY = "b";
    process.env.TAVILY_API_KEY = "t";
  });

  afterEach(() => {
    if (originalBrave === undefined) {
      delete process.env.BRAVE_API_KEY;
    } else {
      process.env.BRAVE_API_KEY = originalBrave;
    }
    if (originalTavily === undefined) {
      delete process.env.TAVILY_API_KEY;
    } else {
      process.env.TAVILY_API_KEY = originalTavily;
    }
  });

  it("includes keyed providers plus the keyless fallback and stub", () => {
    const names = enabledProviders().map((p) => p.name);
    expect(names).toContain("brave");
    expect(names).toContain("tavily");
    expect(names).toContain("duckduckgo");
    expect(names).toContain("serpapi");
  });

  it("excludes keyed providers when their keys are absent", () => {
    delete process.env.BRAVE_API_KEY;
    delete process.env.TAVILY_API_KEY;
    const names = enabledProviders().map((p) => p.name);
    expect(names).not.toContain("brave");
    expect(names).not.toContain("tavily");
    expect(names).toContain("duckduckgo");
  });
});

describe("aggregateSearch", () => {
  beforeEach(() => {
    process.env.BRAVE_API_KEY = "b";
    process.env.TAVILY_API_KEY = "t";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("flattens results from all providers", async () => {
    braveSearch.mockResolvedValue([braveResult]);
    ddgSearch.mockResolvedValue([ddgResult]);
    tavilySearch.mockResolvedValue([]);
    serpapiSearch.mockResolvedValue([]);

    const results = await aggregateSearch("hello", { count: 5 });

    expect(results).toHaveLength(2);
    expect(results).toContainEqual(braveResult);
    expect(results).toContainEqual(ddgResult);
  });

  it("tolerates one provider throwing and keeps the others' results", async () => {
    braveSearch.mockRejectedValue(new Error("brave exploded"));
    ddgSearch.mockResolvedValue([ddgResult]);
    tavilySearch.mockResolvedValue([]);
    serpapiSearch.mockResolvedValue([]);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const results = await aggregateSearch("hello", {});

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(ddgResult);
    expect(warn).toHaveBeenCalled();
  });
});
