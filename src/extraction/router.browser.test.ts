import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Cache } from "../utils/cache.js";
import type { FetchedPage } from "./fetch.js";
import type { PageMetadata } from "./metadata.js";
import type { StructuredData } from "./structured.js";
import type { RouterDeps } from "./router.js";

// The pool is created inside the router, so the class itself is the seam.
const { renderWithBrowser, closePool } = vi.hoisted(() => ({
  renderWithBrowser: vi.fn(),
  closePool: vi.fn(),
}));

vi.mock("./browser.js", () => ({
  DEFAULT_POOL_SIZE: 3,
  BrowserPool: class {
    renderWithBrowser = renderWithBrowser;
    close = closePool;
  },
}));

const { getPage, closeSharedBrowserPool } = await import("./router.js");

/** An empty shell page: no readable text, no structured data. */
const SHELL_HTML =
  "<html><head><title>Shell</title></head><body><div id=root></div></body></html>";

const EMPTY_STRUCTURED: StructuredData = {
  jsonLd: [],
  nextData: undefined,
  nextFlight: "",
  nuxt: undefined,
  apollo: undefined,
  initialState: undefined,
};

const METADATA: PageMetadata = {
  title: "Shell",
  description: "",
  published: "",
  author: "",
  siteName: "",
};

function fetched(html: string): FetchedPage {
  return {
    html,
    headers: { "content-type": "text/html" },
    status: 200,
    url: "https://shell.example/p",
  };
}

/** Deps that always fall through Level 1 and Level 2 to the browser tier. */
function shellDeps(cache: Cache): RouterDeps {
  return {
    cache,
    fetchPage: vi.fn().mockResolvedValue(fetched(SHELL_HTML)),
    extractWithReadability: vi.fn().mockReturnValue(null),
    extractStructuredData: vi.fn().mockReturnValue(EMPTY_STRUCTURED),
    extractMetadata: vi.fn().mockReturnValue(METADATA),
    browserPool: undefined,
  };
}

const ORIGINAL_DISABLE = process.env.BETTER_WEB_SEARCH_DISABLE_BROWSER;

beforeEach(() => {
  delete process.env.BETTER_WEB_SEARCH_DISABLE_BROWSER;
  renderWithBrowser.mockReset();
  renderWithBrowser.mockResolvedValue({ html: SHELL_HTML, captured: [] });
  closePool.mockReset();
});

afterEach(async () => {
  await closeSharedBrowserPool();
  if (ORIGINAL_DISABLE === undefined) {
    delete process.env.BETTER_WEB_SEARCH_DISABLE_BROWSER;
  } else {
    process.env.BETTER_WEB_SEARCH_DISABLE_BROWSER = ORIGINAL_DISABLE;
  }
});

describe("shared browser pool", () => {
  it("escalates to Level 3 even though no caller injects a pool", async () => {
    const result = await getPage(
      "https://shell.example/p",
      {},
      shellDeps(new Cache({ memory: true })),
    );

    expect(renderWithBrowser).toHaveBeenCalledWith("https://shell.example/p");
    expect(result.extraction.rendered).toBe(true);
    expect(result.extraction.method).toBe("rendered_dom");
  });

  it("reuses one pool across calls rather than launching per request", async () => {
    const cache = new Cache({ memory: true });
    await getPage("https://shell.example/a", {}, shellDeps(cache));
    await getPage("https://shell.example/b", {}, shellDeps(cache));

    expect(renderWithBrowser).toHaveBeenCalledTimes(2);
    await closeSharedBrowserPool();
    expect(closePool).toHaveBeenCalledTimes(1);
  });

  it("creates no pool when BETTER_WEB_SEARCH_DISABLE_BROWSER is set", async () => {
    process.env.BETTER_WEB_SEARCH_DISABLE_BROWSER = "true";

    const result = await getPage(
      "https://shell.example/p",
      {},
      shellDeps(new Cache({ memory: true })),
    );

    expect(renderWithBrowser).not.toHaveBeenCalled();
    expect(result.extraction.rendered).toBe(false);
  });

  it("closing when nothing was created is a no-op", async () => {
    await closeSharedBrowserPool();
    expect(closePool).not.toHaveBeenCalled();
  });
});

describe("domain-profile browser shortcut", () => {
  it("skips the render for a domain already served without JavaScript", async () => {
    const cache = new Cache({ memory: true });
    cache.setDomain("shell.example", {
      requires_js: false,
      framework: "unknown",
      has_json_ld: false,
      api_patterns: [],
      best_method: "readability",
    });

    const result = await getPage("https://shell.example/p", {}, shellDeps(cache));

    expect(renderWithBrowser).not.toHaveBeenCalled();
    expect(result.extraction.rendered).toBe(false);
  });

  it("still renders when the profile says the domain needs JavaScript", async () => {
    const cache = new Cache({ memory: true });
    cache.setDomain("shell.example", {
      requires_js: true,
      framework: "Next.js:App",
      has_json_ld: false,
      api_patterns: [],
      best_method: "browser_api_intercept",
    });

    await getPage("https://shell.example/p", {}, shellDeps(cache));

    expect(renderWithBrowser).toHaveBeenCalled();
  });

  it("still renders when the profile's best method was the browser", async () => {
    const cache = new Cache({ memory: true });
    cache.setDomain("shell.example", {
      requires_js: false,
      framework: "unknown",
      has_json_ld: false,
      api_patterns: [],
      best_method: "browser_api_intercept",
    });

    await getPage("https://shell.example/p", {}, shellDeps(cache));

    expect(renderWithBrowser).toHaveBeenCalled();
  });

  it("lets an explicit browser mode override the profile", async () => {
    const cache = new Cache({ memory: true });
    cache.setDomain("shell.example", {
      requires_js: false,
      framework: "unknown",
      has_json_ld: false,
      api_patterns: [],
      best_method: "readability",
    });

    await getPage("https://shell.example/p", { mode: "browser" }, shellDeps(cache));

    expect(renderWithBrowser).toHaveBeenCalled();
  });

  it("ignores a cached profile that predates the current shape", async () => {
    const cache = new Cache({ memory: true });
    cache.setDomain("shell.example", { stale: true });

    await getPage("https://shell.example/p", {}, shellDeps(cache));

    expect(renderWithBrowser).toHaveBeenCalled();
  });
});
