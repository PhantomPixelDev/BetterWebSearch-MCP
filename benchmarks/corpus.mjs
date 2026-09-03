#!/usr/bin/env node
/**
 * Freeze a page corpus, then evaluate passage selection against it offline.
 *
 * The live retention benchmark cannot resolve a change of a few percent: the
 * same question returns different pages minutes apart, so a rerun moves for
 * reasons that have nothing to do with the code. Freezing the pages once and
 * replaying them makes selection deterministic, which is what an A/B of a
 * ranking change actually needs.
 *
 *   node benchmarks/corpus.mjs fetch    # fetch pages once, write the corpus
 *   node benchmarks/corpus.mjs eval     # score the current build against it
 *
 * `eval` reports, per question, whether the answer marker survives into the
 * selected passages. Because the corpus is fixed, two eval runs differ only if
 * the selection code changed.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const dist = (file) => pathToFileURL(join(root, "dist", file)).href;

const CORPUS = join(here, "results", "corpus.json");

/** Pages opened per question, matching the retention benchmark. */
const PAGES = 5;

/** Passages taken from each page, matching research.ts PASSAGES_PER_PAGE. */
const PER_PAGE = 2;

/** Total cited spans, matching research.ts MAX_EXCERPTS. */
const LIMIT = 5;

function questions() {
  const { questions } = JSON.parse(
    readFileSync(join(here, "quality.json"), "utf8"),
  );
  return questions;
}

async function fetchCorpus() {
  const { runSearch } = await import(dist("tools/search.js"));
  const { getPage } = await import(dist("extraction/router.js"));

  const corpus = {};
  for (const question of questions()) {
    process.stdout.write(`  ${question.id.padEnd(22)} `);
    try {
      const search = await runSearch({ query: question.text, max_results: 10 });
      const pages = [];
      for (const source of search.sources.slice(0, PAGES)) {
        try {
          const page = await getPage(source.url, {}, {});
          if (page.content.trim() !== "") {
            pages.push({ url: source.url, content: page.content });
          }
        } catch {
          // An agent that cannot open a page moves on.
        }
      }
      corpus[question.id] = pages;
      console.log(`${pages.length} pages`);
    } catch (error) {
      corpus[question.id] = [];
      console.log(`FAILED: ${error}`);
    }
  }

  mkdirSync(dirname(CORPUS), { recursive: true });
  writeFileSync(CORPUS, `${JSON.stringify(corpus)}\n`);
  console.log(`\nCorpus written to ${CORPUS}`);
}

async function evaluate() {
  if (!existsSync(CORPUS)) {
    console.error("No corpus. Run: node benchmarks/corpus.mjs fetch");
    process.exitCode = 1;
    return;
  }
  const { selectPassages } = await import(dist("ranking/passages.js"));
  const corpus = JSON.parse(readFileSync(CORPUS, "utf8"));

  const byCategory = {};
  const rows = [];
  for (const question of questions()) {
    const pages = corpus[question.id] ?? [];
    const matches = (text) =>
      question.must_contain.some((p) => new RegExp(p, "i").test(text));

    const inCorpus = pages.some((page) => matches(page.content));

    // Mirror the cross-page selection: best passages per page, then the top
    // LIMIT overall by score.
    const candidates = [];
    for (const page of pages) {
      for (const passage of selectPassages(page.content, question.text, PER_PAGE)) {
        candidates.push(passage);
      }
    }
    candidates.sort((a, b) => b.score - a.score);
    const retained = candidates
      .slice(0, LIMIT)
      .map((passage) => passage.text)
      .join("\n\n");
    const kept = matches(retained);

    const category = question.category ?? "uncategorized";
    byCategory[category] ??= { found: 0, kept: 0 };
    if (inCorpus) {
      byCategory[category].found += 1;
      if (kept) byCategory[category].kept += 1;
    }
    rows.push({ id: question.id, category, inCorpus, kept });
  }

  const found = rows.filter((r) => r.inCorpus);
  const kept = found.filter((r) => r.kept);
  console.log(`\nOffline retention on the frozen corpus`);
  console.log(`${"=".repeat(52)}`);
  for (const [category, stats] of Object.entries(byCategory)) {
    const rate = stats.found ? (stats.kept / stats.found) * 100 : 0;
    console.log(
      `  ${category.padEnd(14)} ${String(stats.kept).padStart(2)}/${String(stats.found).padEnd(3)} ${rate.toFixed(1)}%`,
    );
  }
  console.log(`${"-".repeat(52)}`);
  console.log(
    `  ${"OVERALL".padEnd(14)} ${String(kept.length).padStart(2)}/${String(found.length).padEnd(3)} ${((kept.length / (found.length || 1)) * 100).toFixed(1)}%`,
  );
  console.log(`${"=".repeat(52)}`);
  const lost = found.filter((r) => !r.kept).map((r) => r.id);
  if (lost.length > 0) console.log(`lost: ${lost.join(", ")}`);
}

const mode = process.argv[2] ?? "eval";
if (mode === "fetch") {
  await fetchCorpus();
} else {
  await evaluate();
}
