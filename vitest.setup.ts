import { beforeEach } from "vitest";

import { resetRateLimiters } from "./src/utils/rateLimit.js";

/**
 * Test environment defaults, applied before every suite.
 *
 * The router creates a shared Playwright pool lazily whenever a test reaches
 * Level 3 without injecting one. No suite does that today, but CI runners have
 * no browser binaries, so a stray escalation would try to launch chromium
 * inside the test process. Disabling the browser tier by default makes that
 * impossible for any test written later.
 *
 * `router.browser.test.ts` exercises the tier on purpose: it clears this flag
 * per-test and mocks `BrowserPool`, so no real browser is ever launched.
 */
process.env.BETTER_WEB_SEARCH_DISABLE_BROWSER = "true";

/**
 * Disable request pacing in tests.
 *
 * Providers space their requests by a second so an expanded research question
 * does not burst at one endpoint. That is right in production and pointless in
 * unit tests, where it would only add real waiting to every provider case.
 */
process.env.BETTER_WEB_SEARCH_RATE_LIMIT_MS = "0";

/**
 * Clear provider limiters between cases.
 *
 * The registry is module-level, so a cooldown started by a test that exercises
 * a challenge page would otherwise make every later provider test fail with
 * "cooling down".
 */
beforeEach(() => {
  resetRateLimiters();
});
