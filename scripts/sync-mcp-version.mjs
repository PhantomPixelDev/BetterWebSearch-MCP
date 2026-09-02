#!/usr/bin/env node
/**
 * Copy the package version into mcp.json.
 *
 * Runs from the `version` lifecycle hook, which npm fires after bumping
 * package.json but before it creates the release commit, so the synced
 * mcp.json lands in that same commit. Without this the manifest silently
 * drifts — it still read 0.1.0 while npm was publishing 0.2.1.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkgPath = join(root, "package.json");
const mcpPath = join(root, "mcp.json");

const { version } = JSON.parse(readFileSync(pkgPath, "utf8"));
const raw = readFileSync(mcpPath, "utf8");
const manifest = JSON.parse(raw);

if (manifest.version === version) {
  process.exit(0);
}

manifest.version = version;
// Preserve the file's existing trailing newline convention.
const trailing = raw.endsWith("\n") ? "\n" : "";
writeFileSync(mcpPath, `${JSON.stringify(manifest, null, 2)}${trailing}`);
process.stdout.write(`mcp.json version -> ${version}\n`);
