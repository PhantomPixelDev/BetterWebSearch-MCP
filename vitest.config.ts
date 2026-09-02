import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./vitest.setup.ts"],
    // One suite opens a real better-sqlite3 database, and better-sqlite3 is
    // a native N-API addon. Tearing one down while other files are still
    // initializing it trips an assertion inside the addon itself —
    // "Assertion failed: (env) != nullptr" — which kills the runner process and
    // surfaces as "Error: Worker exited unexpectedly" from tinypool. It hit
    // roughly one CI run in four, including commits that touched only docs.
    //
    // Threads made it worst, since a native abort takes the whole thread down,
    // and forks with singleFork lowered the rate without removing it: vitest
    // tears the addon's N-API environment down between test *files*, so any
    // file boundary after better-sqlite3 has loaded is a chance to abort.
    //
    // The reliable part of the fix lives in package.json, which runs
    // cache.test.ts in its own vitest invocation. That file is then the only
    // one in its process, so the addon's environment is destroyed at process
    // exit rather than at a file boundary. singleFork is kept for the rest.
    pool: "forks",
    poolOptions: {
      forks: { singleFork: true },
    },
  },
});
