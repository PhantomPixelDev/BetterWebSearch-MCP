#!/usr/bin/env node
/**
 * Evidence-retention benchmark.
 *
 * The token-efficiency benchmark shows `web_research` returns far less text.
 * That is only a win if the text it keeps still contains the answer, and
 * measuring *that* usually needs a judge model. This harness avoids one by
 * restricting itself to questions with an unambiguous marker — a port number,
 * a status code, a license name — and asking a narrower question that a regex
 * can settle:
 *
 *   given the answer was present in the raw pages, did compression keep it?
 *
 * Retention is therefore conditioned on the baseline. A question whose marker
 * never appeared in the fetched pages is a retrieval miss, not a compression
 * loss, and is excluded from the retention figure and reported separately.
 * Without that split the number would silently blame the passage selector for
 * DuckDuckGo returning weak results.
 *
 * What this still does not measure: whether the sources are correct, whether
 * the surrounding context is misleading, or anything about open-ended
 * questions where no single marker settles the answer.
 *
 * Usage:
 *   npm run build && node benchmarks/quality.mjs [--out file.json]
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const dist = (file) => pathToFileURL(join(root, "dist", file)).href;

const { runSearch } = await import(dist("tools/search.js"));
const { runResearch } = await import(dist("tools/research.js"));
const { getPage } = await import(dist("extraction/router.js"));

/** Top results a hand-driven agent would open, matching run.mjs. */
const BASELINE_PAGES = 5;

function parseArgs(argv) {
  const args = { out: join(here, "results", "quality.json") };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--out") args.out = argv[++i];
  }
  return args;
}

/** Whether any marker matches the text. */
function matches(text, patterns) {
  return patterns.some((pattern) => new RegExp(pattern, "i").test(text));
}

/** Which markers matched, for reporting. */
function matched(text, patterns) {
  return patterns.filter((pattern) => new RegExp(pattern, "i").test(text));
}

/** The concatenated content an agent would have read for itself. */
async function baselineText(question) {
  const search = await runSearch({ query: question, max_results: 10 });
  const parts = [JSON.stringify(search)];
  for (const source of search.sources.slice(0, BASELINE_PAGES)) {
    try {
      const page = await getPage(source.url, {}, {});
      parts.push(page.content);
    } catch {
      // An agent that cannot open a page moves on.
    }
  }
  return parts.join("\n\n");
}

async function measure(question) {
  const base = await baselineText(question.text);
  const research = await runResearch({ question: question.text });

  // Only the cited spans and the assembled answer count as retained: the
  // sources array carries titles and snippets the agent did not ask to read.
  const retained = [
    research.answer,
    ...research.citations.map((citation) => citation.quote),
  ].join("\n\n");

  const inBaseline = matches(base, question.must_contain);
  const inRetained = matches(retained, question.must_contain);

  return {
    id: question.id,
    category: question.category ?? "uncategorized",
    question: question.text,
    answer_in_baseline: inBaseline,
    answer_in_retained: inRetained,
    matched_markers: matched(retained, question.must_contain),
    baseline_chars: base.length,
    retained_chars: retained.length,
    cited_spans: research.citations.length,
    independent_sources: research.evidence?.independent_sources ?? 0,
    sources_opened: research.evidence?.sources_opened ?? 0,
  };
}

function summarize(rows) {
  const ok = rows.filter((row) => row.ok !== false);
  const found = ok.filter((row) => row.answer_in_baseline);
  const kept = found.filter((row) => row.answer_in_retained);
  const baselineChars = ok.reduce((n, r) => n + r.baseline_chars, 0);
  const retainedChars = ok.reduce((n, r) => n + r.retained_chars, 0);
  // Per-category retention is what tells a systematic weakness apart from a
  // single unlucky question. The first run lost one acronym case; without this
  // split there is no way to know whether that was the category or the luck.
  const categories = {};
  for (const row of ok) {
    const key = row.category ?? "uncategorized";
    categories[key] ??= { found: 0, kept: 0 };
    if (row.answer_in_baseline) {
      categories[key].found += 1;
      if (row.answer_in_retained) {
        categories[key].kept += 1;
      }
    }
  }
  for (const stats of Object.values(categories)) {
    stats.retention = stats.found > 0 ? stats.kept / stats.found : 0;
  }

  return {
    questions_attempted: rows.length,
    questions_measured: ok.length,
    answer_found_in_baseline: found.length,
    answer_retained: kept.length,
    // Conditioned on the baseline: this is compression loss, not retrieval.
    retention: found.length > 0 ? kept.length / found.length : 0,
    by_category: categories,
    baseline_chars: baselineChars,
    retained_chars: retainedChars,
    reduction: baselineChars > 0 ? 1 - retainedChars / baselineChars : 0,
  };
}

const pct = (value) => `${(value * 100).toFixed(1)}%`;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { questions } = JSON.parse(
    readFileSync(join(here, "quality.json"), "utf8"),
  );

  console.log(
    `Evidence retention: ${questions.length} questions with checkable answers.\n`,
  );
  mkdirSync(dirname(args.out), { recursive: true });

  const rows = [];
  const save = () =>
    writeFileSync(
      args.out,
      `${JSON.stringify({ generated: new Date().toISOString(), summary: summarize(rows), rows }, null, 2)}\n`,
    );

  for (const question of questions) {
    try {
      const row = await measure(question);
      rows.push(row);
      save();
      const verdict = !row.answer_in_baseline
        ? "not retrieved"
        : row.answer_in_retained
          ? "KEPT"
          : "LOST BY COMPRESSION";
      console.log(
        `  ${question.id.padEnd(22)} ${verdict.padEnd(20)} ` +
          `${String(row.baseline_chars).padStart(7)}ch -> ${String(row.retained_chars).padStart(5)}ch`,
      );
    } catch (error) {
      rows.push({ id: question.id, ok: false, error: String(error) });
      save();
      console.log(`  ${question.id.padEnd(22)} FAILED: ${error}`);
    }
  }

  const summary = summarize(rows);
  save();

  console.log(`\n${"=".repeat(66)}`);
  console.log(`Measured             ${summary.questions_measured}/${summary.questions_attempted}`);
  console.log(`Answer in baseline   ${summary.answer_found_in_baseline}  (the rest are retrieval misses, not compression loss)`);
  console.log(`Answer retained      ${summary.answer_retained}`);
  console.log(`Retention            ${pct(summary.retention)}  of answers that were there to keep`);
  console.log(`Payload reduction    ${pct(summary.reduction)} on this set`);
  console.log(`${"-".repeat(66)}`);
  for (const [category, stats] of Object.entries(summary.by_category)) {
    console.log(
      `  ${category.padEnd(14)} ${String(stats.kept).padStart(2)}/${String(stats.found).padEnd(3)} ${pct(stats.retention)}`,
    );
  }
  console.log(`${"=".repeat(66)}`);
  console.log(`\nReport written to ${args.out}`);
}

await main();
