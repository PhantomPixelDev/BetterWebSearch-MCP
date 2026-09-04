import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Cache } from "../utils/cache.js";
import { BlockedUrlError } from "../utils/ssrf.js";
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
    // The browser tier runs the SSRF guard too, so these fixtures need a
    // resolver or the suite would depend on shell.example resolving.
    ssrf: { resolve: async () => ["93.184.216.34"] },
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


describe("browser tier SSRF guard", () => {
  /**
   * Regression test for a real bypass.
   *
   * The guard used to live only in fetchPage. The router swallows a fetch
   * failure so the pipeline can escalate, so a blocked URL produced empty
   * html, skipped Levels 1 and 2, and was then loaded by Playwright. Verified
   * against a local server before the fix: the HTTP tier reported
   * BlockedUrlError and the browser tier returned the page body.
   */
  function blockedDeps(cache: Cache): RouterDeps {
    return {
      ...shellDeps(cache),
      // Whatever the hostname, it resolves somewhere private.
      ssrf: { resolve: async () => ["127.0.0.1"] },
    };
  }

  it("does not render a URL the fetch guard would refuse", async () => {
    const result = await getPage(
      "http://internal.example/admin",
      {},
      blockedDeps(new Cache({ memory: true })),
    );

    expect(renderWithBrowser).not.toHaveBeenCalled();
    expect(result.extraction.rendered).toBe(false);
  });

  it("refuses a literal private address even in forced browser mode", async () => {
    await getPage(
      "http://169.254.169.254/latest/meta-data/",
      { mode: "browser" },
      shellDeps(new Cache({ memory: true })),
    );

    // mode: "browser" must not be an escape hatch around the guard.
    expect(renderWithBrowser).not.toHaveBeenCalled();
  });

  it("still renders a public URL", async () => {
    await getPage(
      "https://shell.example/p",
      {},
      shellDeps(new Cache({ memory: true })),
    );

    expect(renderWithBrowser).toHaveBeenCalled();
  });
});


describe("blocked URLs are reported, not silently empty", () => {
  it("propagates the refusal instead of returning a blank best-effort page", async () => {
    // Swallowing the guard's error returned an empty page at best-effort
    // confidence, so a caller could not tell a blocked address from a dead
    // site and got no reason for either.
    // The guard lives in fetchPage, so the seam under test is how the router
    // reacts to its refusal.
    const deps = {
      ...shellDeps(new Cache({ memory: true })),
      fetchPage: vi
        .fn()
        .mockRejectedValue(
          new BlockedUrlError(
            "http://internal.example/admin",
            "address 10.0.0.5 is not public",
          ),
        ),
    };

    await expect(
      getPage("http://internal.example/admin", {}, deps),
    ).rejects.toBeInstanceOf(BlockedUrlError);
  });

  it("still degrades quietly for an ordinary network failure", async () => {
    const deps = {
      ...shellDeps(new Cache({ memory: true })),
      fetchPage: vi.fn().mockRejectedValue(new Error("ECONNRESET")),
    };

    const result = await getPage("https://shell.example/p", {}, deps);

    expect(result.extraction.confidence).toBeLessThanOrEqual(0.9);
  });
});
