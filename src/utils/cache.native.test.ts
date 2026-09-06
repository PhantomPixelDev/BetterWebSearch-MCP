import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

/**
 * Guards the one property that keeps the test suite from aborting.
 *
 * better-sqlite3 is a native N-API addon. Vitest destroys the addon's
 * environment at every test-*file* boundary, and an addon that is loaded when
 * that happens aborts the whole runner with
 * `Assertion failed: (env) != nullptr`, surfacing as "Worker exited
 * unexpectedly". It killed roughly one CI run in four, including commits that
 * touched nothing but documentation.
 *
 * `openDatabase` used to call `loadDatabase()` before testing `opts.memory`,
 * so every `new Cache({ memory: true })` — which is every unit test — loaded
 * the addon it had just declined to use. Isolating `cache.test.ts` into its
 * own vitest invocation hid the symptom without removing the cause.
 *
 * The check runs in a child process because the CommonJS module cache is
 * process-wide: asking in-process would only report what some earlier test
 * file happened to load.
 */

/** Run a snippet under tsx and return its stdout, trimmed. */
function runInChild(source: string): string {
  return execFileSync(
    process.execPath,
    ["--import", "tsx", "--input-type=module", "--eval", source],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  ).trim();
}

/** Reports whether better-sqlite3 sits in the CommonJS module cache. */
const PROBE = `
import { createRequire } from "node:module";
import { Cache } from "./src/utils/cache.ts";
const require = createRequire(import.meta.url);
const loaded = () =>
  Object.keys(require.cache).some((k) => k.includes("better-sqlite3"));
`;

describe("Cache in memory mode", () => {
  it("does not load the better-sqlite3 addon", () => {
    const out = runInChild(
      `${PROBE}
const cache = new Cache({ memory: true });
cache.close();
console.log(JSON.stringify({ memory: cache.isMemory, addon: loaded() }));`,
    );

    expect(JSON.parse(out)).toEqual({ memory: true, addon: false });
  });

  it("still loads the addon for a real database, so the probe means something", () => {
    // Without this the first test would pass just as well if the addon could
    // never be loaded at all.
    const out = runInChild(
      `${PROBE}
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const dir = mkdtempSync(join(tmpdir(), "bws-cache-"));
const cache = new Cache({ dbPath: join(dir, "cache.db") });
const addon = loaded();
cache.close();
console.log(JSON.stringify({ memory: cache.isMemory, addon }));`,
    );

    expect(JSON.parse(out)).toEqual({ memory: false, addon: true });
  });
});
