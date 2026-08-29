/**
 * Postinstall check: verify the better-sqlite3 native binding loads.
 *
 * better-sqlite3 ships a compiled native addon. On some platforms (older
 * Node, missing build tools, CI sandboxes) the binding fails to load. The
 * Cache class transparently falls back to an in-memory Map, so this is a
 * warning, not an error — the server still works without SQLite.
 */

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

try {
  require("better-sqlite3");
  console.log("check-native: better-sqlite3 native binding OK");
} catch {
  console.warn(
    "better-sqlite3 native binding missing — falling back to memory cache. " +
      "Run `npm rebuild better-sqlite3` or use Node 20+",
  );
}