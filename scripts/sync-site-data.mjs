#!/usr/bin/env node
/**
 * Copy release facts from package.json into site/data/project.json.
 *
 * Hugo can only read data files under the site directory, so the version,
 * package name and license would otherwise be hand-typed into templates and
 * drift the way mcp.json did. This runs from the `version` lifecycle hook, so
 * the refreshed file lands in the release commit, and again from `docs:build`
 * so a site built from a working tree is never stale.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

const data = {
  name: pkg.name,
  version: pkg.version,
  license: pkg.license,
  description: pkg.description,
  nodeVersion: pkg.engines?.node ?? "",
};

const outDir = join(root, "site", "data");
mkdirSync(outDir, { recursive: true });
const out = join(outDir, "project.json");

const next = `${JSON.stringify(data, null, 2)}\n`;
let current = "";
try {
  current = readFileSync(out, "utf8");
} catch {
  /* First run: the file does not exist yet. */
}
if (current === next) {
  process.exit(0);
}

writeFileSync(out, next);
process.stdout.write(`site/data/project.json version -> ${pkg.version}\n`);
