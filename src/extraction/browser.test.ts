import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BrowserPool,
  PlaywrightMissingError,
  intelligentWait,
  shouldBlockResource,
  waitForDomStability,
  type WaitPage,
} from "./browser.js";

const mocks = vi.hoisted(() => ({
  launch: vi.fn(),
}));

vi.mock("playwright", () => ({
  chromium: { launch: mocks.launch },
}));

/** A fake Playwright page with configurable behavior. */
function makePage(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    route: vi.fn().mockResolvedValue(undefined),
    goto: vi.fn().mockResolvedValue(undefined),
    content: vi.fn().mockResolvedValue("<html>rendered</html>"),
    close: vi.fn().mockResolvedValue(undefined),
    waitForLoadState: vi.fn().mockRejectedValue(new Error("timeout")),
    waitForSelector: vi.fn().mockRejectedValue(new Error("timeout")),
    waitForFunction: vi.fn().mockRejectedValue(new Error("timeout")),
    evaluate: vi.fn().mockResolvedValue(""),
    on: vi.fn(),
    off: vi.fn(),
    ...overrides,
  };
}

/** A fake Playwright context that hands out pages. */
function makeContext(pages: unknown[]) {
  return {
    newPage: vi.fn().mockImplementation(async () => pages[0]),
    close: vi.fn().mockResolvedValue(undefined),
  };
}

/** A fake Playwright browser that hands out contexts. */
function makeBrowser(contexts: unknown[]) {
  return {
    newContext: vi.fn().mockImplementation(async () => contexts[0]),
    close: vi.fn().mockResolvedValue(undefined),
  };
}

describe("shouldBlockResource", () => {
  it("blocks image, font, and media", () => {
    expect(shouldBlockResource("image")).toBe(true);
    expect(shouldBlockResource("font")).toBe(true);
    expect(shouldBlockResource("media")).toBe(true);
  });

  it("allows script, document, and stylesheet", () => {
    expect(shouldBlockResource("script")).toBe(false);
    expect(shouldBlockResource("document")).toBe(false);
    expect(shouldBlockResource("stylesheet")).toBe(false);
  });
});

describe("intelligentWait", () => {
  it("does not throw when every race leg times out", async () => {
    const page = makePage() as unknown as WaitPage;
    await expect(intelligentWait(page)).resolves.toBeUndefined();
  });

  it("resolves when the article selector appears", async () => {
    const page = makePage({
      waitForSelector: vi.fn().mockResolvedValue({}),
    }) as unknown as WaitPage;
    await expect(intelligentWait(page)).resolves.toBeUndefined();
  });
});

describe("waitForDomStability", () => {
  it("returns immediately when innerText is already stable", async () => {
    const page = makePage({
      evaluate: vi.fn().mockResolvedValue(""),
    }) as unknown as WaitPage;
    await expect(waitForDomStability(page)).resolves.toBeUndefined();
  });
});

describe("BrowserPool", () => {
  beforeEach(() => {
    mocks.launch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reuses a single browser across multiple renders", async () => {
    const page = makePage();
    const context = makeContext([page]);
    const browser = makeBrowser([context]);
    mocks.launch.mockResolvedValue(browser);

    const pool = new BrowserPool(3);
    const first = await pool.renderWithBrowser("https://example.com/a");
    const second = await pool.renderWithBrowser("https://example.com/b");

    expect(mocks.launch).toHaveBeenCalledTimes(1);
    expect(mocks.launch).toHaveBeenCalledWith({
      headless: true,
      args: ["--no-sandbox"],
    });
    expect(browser.newContext).toHaveBeenCalledTimes(2);
    expect(first.html).toBe("<html>rendered</html>");
    expect(second.html).toBe("<html>rendered</html>");

    await pool.close();
    expect(browser.close).toHaveBeenCalledTimes(1);
  });

  it("sets up resource blocking on the page", async () => {
    const page = makePage();
    const context = makeContext([page]);
    const browser = makeBrowser([context]);
    mocks.launch.mockResolvedValue(browser);

    const pool = new BrowserPool(3);
    await pool.renderWithBrowser("https://example.com/");

    expect(page.route).toHaveBeenCalledWith("**/*", expect.any(Function));
    await pool.close();
  });

  it("returns partial html when navigation times out instead of throwing", async () => {
    const page = makePage({
      goto: vi.fn().mockRejectedValue(new Error("Navigation timeout")),
    });
    const context = makeContext([page]);
    const browser = makeBrowser([context]);
    mocks.launch.mockResolvedValue(browser);

    const pool = new BrowserPool(3);
    const result = await pool.renderWithBrowser("https://example.com/slow");

    expect(result.html).toBe("<html>rendered</html>");
    await pool.close();
  });

  it("throws a clear actionable error when the browser binary is missing", async () => {
    mocks.launch.mockRejectedValue(new Error("Executable doesn't exist"));

    const pool = new BrowserPool(3);
    await expect(
      pool.renderWithBrowser("https://example.com/"),
    ).rejects.toBeInstanceOf(PlaywrightMissingError);
    await expect(
      pool.renderWithBrowser("https://example.com/"),
    ).rejects.toThrow("Run npx playwright install chromium");
  });

  it("closes all contexts and the browser on close()", async () => {
    const page = makePage();
    const context = makeContext([page]);
    const browser = makeBrowser([context]);
    mocks.launch.mockResolvedValue(browser);

    const pool = new BrowserPool(3);
    await pool.renderWithBrowser("https://example.com/");
    await pool.close();

    expect(context.close).toHaveBeenCalledTimes(1);
    expect(browser.close).toHaveBeenCalledTimes(1);
  });
});
