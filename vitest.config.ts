import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./vitest.setup.ts"],
    // `cache.test.ts` opens a real better-sqlite3 database, and better-sqlite3
    // is a native N-API addon. Native addons loaded inside worker threads can
    // abort the thread outright instead of throwing, which surfaced in CI as an
    // intermittent "Error: Worker exited unexpectedly" from tinypool — roughly
    // one run in four, on commits that touched nothing but documentation.
    // Forks run each test file in a child process, where a native crash is
    // contained and reported normally.
    pool: "forks",
  },
});
