import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./vitest.setup.ts"],
    // Several suites open a real better-sqlite3 database, and better-sqlite3 is
    // a native N-API addon. Tearing one down while other files are still
    // initializing it trips an assertion inside the addon itself —
    // "Assertion failed: (env) != nullptr" — which kills the runner process and
    // surfaces as "Error: Worker exited unexpectedly" from tinypool. It hit
    // roughly one CI run in four, including commits that touched only docs.
    //
    // Threads made it worst, since a native abort takes the whole thread down.
    // Forks contain the crash, but files still run in parallel processes and
    // the addon still races its own teardown, so singleFork serializes them
    // into one child. Costs a little wall time; removes the crash window.
    pool: "forks",
    poolOptions: {
      forks: { singleFork: true },
    },
  },
});
