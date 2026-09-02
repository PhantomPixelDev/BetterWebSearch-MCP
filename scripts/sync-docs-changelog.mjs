#!/usr/bin/env node
/**
 * Regenerate the docs-site changelog from the root CHANGELOG.md.
 *
 * The site copy was maintained by hand and fell four releases behind — it
 * still showed 0.1.0 as the newest version while npm was on 0.2.3. Running
 * this from `docs:build` keeps the published page honest without anyone
 * remembering to copy the file.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "CHANGELOG.md");
const target = join(root, "site", "content", "docs", "changelog.md");

const frontMatter = [
  "---",
  'title: "Changelog"',
  'description: "Release history for BetterWebSearch MCP following Keep a Changelog format."',
  "weight: 90",
  "---",
  "",
].join("\n");

// Drop the root file's own H1: the front matter title renders it on the site,
// and a second H1 would duplicate the page heading.
const body = readFileSync(source, "utf8").replace(/^#\s+Changelog\s*\n+/, "");

writeFileSync(target, `${frontMatter}\n${body}`);
process.stdout.write(`site changelog synced from ${source}\n`);
