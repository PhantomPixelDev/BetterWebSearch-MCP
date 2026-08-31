// @ts-check
/**
 * Post-process TypeDoc markdown output for Hugo compatibility.
 *
 * 1. Rename the root `index.md` to `_index.md` so Hugo treats `docs/api/`
 *    as a section (a leaf `index.md` would swallow all nested module pages).
 * 2. Ensure every generated markdown file carries Hugo YAML front-matter
 *    (title + weight) so pages render and order correctly.
 */
import { readdirSync, readFileSync, renameSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";

const API_DIR = join(process.cwd(), "site", "content", "docs", "api");

/** Recursively collect all .md files under a directory. */
function collectMd(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectMd(full));
    } else if (entry.name.endsWith(".md")) {
      out.push(full);
    }
  }
  return out;
}

/** Ensure a file has Hugo YAML front-matter; prepend if missing. */
function ensureFrontmatter(file) {
  const raw = readFileSync(file, "utf8");
  if (raw.startsWith("---")) return; // already has front-matter
  const title = dirname(file) === API_DIR ? "API Reference" : "API";
  const frontmatter = `---\ntitle: "${title}"\nweight: 80\ndraft: false\n---\n\n`;
  writeFileSync(file, frontmatter + raw, "utf8");
}

/**
 * Rewrite relative `.md` links to `.html` so Hugo renders clickable links.
 * Hugo does not rewrite relative markdown links when `unsafe = true`.
 * Only rewrites links that point to local `.md` files (not anchors or http).
 */
function rewriteMdLinks(file) {
  const raw = readFileSync(file, "utf8");
  const rewritten = raw.replace(
    /\]\(([^)#]+)\.md(#[^)]*)?\)/g,
    (_m, path, anchor) => `](${path}.html${anchor ?? ""})`,
  );
  if (rewritten !== raw) {
    writeFileSync(file, rewritten, "utf8");
  }
}

if (!existsSync(API_DIR)) {
  console.error(`typedoc-postprocess: API dir not found: ${API_DIR}`);
  process.exit(1);
}

// 1. Rename root index.md -> _index.md (Hugo section index)
const rootIndex = join(API_DIR, "index.md");
const rootSectionIndex = join(API_DIR, "_index.md");
if (existsSync(rootIndex)) {
  renameSync(rootIndex, rootSectionIndex);
  console.log(`typedoc-postprocess: renamed ${rootIndex} -> ${rootSectionIndex}`);
}

// 2. Ensure front-matter on all markdown files
for (const file of collectMd(API_DIR)) {
  ensureFrontmatter(file);
}

// 3. Rewrite relative .md links to .html for Hugo
for (const file of collectMd(API_DIR)) {
  rewriteMdLinks(file);
}

console.log(`typedoc-postprocess: verified front-matter on ${collectMd(API_DIR).length} markdown files`);
