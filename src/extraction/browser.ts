/**
 * Browser rendering pool with resource blocking, intelligent waiting, and
 * API interception.
 *
 * A single Playwright chromium browser is launched lazily and shared across
 * up to {@link BrowserPool.DEFAULT_POOL_SIZE} contexts. Each render creates a
 * fresh page, blocks image/font/media requests, waits intelligently for
 * content (a race of network-idle / article selector / text-length, followed
 * by a DOM-stability poll), and captures JSON API responses for the domain
 * profiler.
 *
 * Playwright is imported dynamically so tests can mock the module, and so a
 * missing browser binary surfaces as a clear, actionable error.
 */

import type { Browser, BrowserContext, Page } from "playwright";

import {
  installApiCapture,
  type CapturedApiResponse,
} from "./apiIntercept.js";

/** Default number of contexts to keep open in the pool. */
export const DEFAULT_POOL_SIZE = 3;

/** Resource types that are safe to block during rendering. */
const BLOCKED_RESOURCE_TYPES = new Set(["image", "font", "media"]);

/** Timeout for the initial navigation, in milliseconds. */
export const NAVIGATION_TIMEOUT_MS = 15_000;

/** Timeout for each intelligent-wait race leg, in milliseconds. */
export const WAIT_LEG_TIMEOUT_MS = 4_000;

/** Timeout for the DOM-stability poll, in milliseconds. */
export const DOM_STABILITY_TIMEOUT_MS = 4_000;

/** Minimum `innerText` length that signals meaningful content. */
export const MIN_CONTENT_LENGTH = 1_000;

/** Delay between DOM-stability polls, in milliseconds. */
export const DOM_STABILITY_POLL_MS = 200;

/** The result of a browser render. */
export interface RenderResult {
  /** The rendered page HTML. */
  html: string;
  /** JSON API responses captured during the render. */
  captured: readonly CapturedApiResponse[];
}

/** Options controlling a single browser render. */
export interface RenderOptions {
  /** Timeout for the initial navigation, in ms. Default 15s. */
  navigationTimeoutMs?: number;
}

/** The playwright module shape we depend on (via dynamic import). */
interface PlaywrightModule {
  chromium: {
    launch(options: { headless: boolean; args: string[] }): Promise<Browser>;
  };
}

/** Thrown when the Playwright browser binary is not installed. */
export class PlaywrightMissingError extends Error {
  constructor() {
    super(
      "Playwright browser binary is missing. Run npx playwright install chromium",
    );
    this.name = "PlaywrightMissingError";
  }
}

/** Whether a resource type should be blocked (image/font/media). */
export function shouldBlockResource(resourceType: string): boolean {
  return BLOCKED_RESOURCE_TYPES.has(resourceType);
}

/** Load the playwright module, throwing a clear error when unavailable. */
async function loadPlaywright(): Promise<PlaywrightModule> {
  try {
    return (await import("playwright")) as PlaywrightModule;
  } catch {
    throw new PlaywrightMissingError();
  }
}

/** The minimal `Page` surface the wait helpers depend on. */
export interface WaitPage {
  waitForLoadState(
    state: "networkidle",
    opts: { timeout: number },
  ): Promise<void>;
  waitForSelector(selector: string, opts: { timeout: number }): Promise<unknown>;
  waitForFunction(fn: () => boolean, opts: { timeout: number }): Promise<unknown>;
  evaluate(fn: () => string): Promise<string>;
}

/**
 * Wait intelligently for content to appear.
 *
 * Races three signals — network idle, an `<article>` element, and
 * `innerText` exceeding {@link MIN_CONTENT_LENGTH} — each with a bounded
 * timeout. Whichever resolves first wins; every leg swallows its own timeout
 * so a slow page never throws here.
 */
export async function intelligentWait(page: WaitPage): Promise<void> {
  await Promise.race([
    page
      .waitForLoadState("networkidle", { timeout: WAIT_LEG_TIMEOUT_MS })
      .catch(() => {}),
    page
      .waitForSelector("article", { timeout: WAIT_LEG_TIMEOUT_MS })
      .catch(() => {}),
    page
      .waitForFunction(
        () => document.body.innerText.length > MIN_CONTENT_LENGTH,
        { timeout: WAIT_LEG_TIMEOUT_MS },
      )
      .catch(() => {}),
  ]);
}

/**
 * Poll the DOM until `innerText` stops growing (content is stable).
 *
 * Returns as soon as two consecutive polls report the same text, or when the
 * {@link DOM_STABILITY_TIMEOUT_MS} budget is exhausted.
 */
export async function waitForDomStability(page: WaitPage): Promise<void> {
  const deadline = Date.now() + DOM_STABILITY_TIMEOUT_MS;
  let previous = "";
  while (Date.now() < deadline) {
    const current = await page.evaluate(() => document.body.innerText);
    if (current === previous) {
      return;
    }
    previous = current;
    await new Promise((resolve) => setTimeout(resolve, DOM_STABILITY_POLL_MS));
  }
}

/**
 * A pool of reusable browser contexts backed by a single chromium instance.
 *
 * The browser is launched lazily on first use and reused for every render.
 * Contexts are created on demand up to {@link DEFAULT_POOL_SIZE} and then
 * reused round-robin, so no render launches a browser per request.
 */
export class BrowserPool {
  private readonly size: number;
  private browser: Browser | null = null;
  private readonly contexts: BrowserContext[] = [];
  private nextContext = 0;
  private launchPromise: Promise<Browser> | null = null;

  constructor(size: number = DEFAULT_POOL_SIZE) {
    this.size = size;
  }

  /** Get the shared browser, launching it lazily on first use. */
  private async getBrowser(): Promise<Browser> {
    if (this.browser !== null) {
      return this.browser;
    }
    if (this.launchPromise === null) {
      this.launchPromise = this.launch();
    }
    return this.launchPromise;
  }

  /** Launch chromium, mapping any failure to a clear actionable error. */
  private async launch(): Promise<Browser> {
    const pw = await loadPlaywright();
    try {
      const browser = await pw.chromium.launch({
        headless: true,
        args: ["--no-sandbox"],
      });
      this.browser = browser;
      return browser;
    } catch {
      this.launchPromise = null;
      // A launch failure is almost always a missing browser binary.
      throw new PlaywrightMissingError();
    }
  }

  /** Get a context from the pool, creating one up to the size limit. */
  private async getContext(): Promise<BrowserContext> {
    const browser = await this.getBrowser();
    if (this.contexts.length < this.size) {
      const context = await browser.newContext();
      this.contexts.push(context);
      return context;
    }
    const context = this.contexts[this.nextContext % this.size];
    this.nextContext += 1;
    return context as BrowserContext;
  }

  /** Block image/font/media requests; continue everything else. */
  private async setupBlocking(page: Page): Promise<void> {
    await page.route("**/*", (route) => {
      const resourceType = route.request().resourceType();
      if (shouldBlockResource(resourceType)) {
        void route.abort();
      } else {
        void route.continue();
      }
    });
  }

  /**
   * Render a URL in a pooled context and return its HTML plus captured JSON
   * API responses.
   *
   * A navigation timeout does not throw: whatever rendered is extracted and
   * returned as partial HTML. The page is always closed and the capture
   * listener removed, even on error.
   */
  async renderWithBrowser(
    url: string,
    opts: RenderOptions = {},
  ): Promise<RenderResult> {
    const context = await this.getContext();
    const page = await context.newPage();
    const captured = installApiCapture(page);
    try {
      await this.setupBlocking(page);
      try {
        await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: opts.navigationTimeoutMs ?? NAVIGATION_TIMEOUT_MS,
        });
      } catch {
        // Navigation timed out or failed; extract whatever rendered.
      }
      await intelligentWait(page);
      await waitForDomStability(page);
      const html = await page.content();
      return { html, captured: captured.captured };
    } finally {
      captured.remove();
      await page.close().catch(() => {});
    }
  }

  /** Close every context and the shared browser, resetting the pool. */
  async close(): Promise<void> {
    for (const context of this.contexts) {
      await context.close().catch(() => {});
    }
    this.contexts.length = 0;
    if (this.browser !== null) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
    this.launchPromise = null;
    this.nextContext = 0;
  }
}
