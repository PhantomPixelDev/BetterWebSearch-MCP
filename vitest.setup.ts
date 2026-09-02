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
