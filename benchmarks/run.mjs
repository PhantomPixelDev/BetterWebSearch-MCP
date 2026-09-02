#!/usr/bin/env node
/**
 * Token-efficiency benchmark.
 *
 * Measures what an agent actually ingests for the same question under two
 * workflows against the same pages, so the only variable is who does the
 * reading:
 *
 *   baseline  the agent drives the tools itself — one `web_search`, then
 *             `web_extract` on each of the top results, and every extracted
 *             page lands in its context
 *   research  one `web_research` call, whose response is the cited passages
 *             plus their metadata
 *
 * Both paths open the same URLs, so this measures the compression the
 * pipeline performs, not a difference in what was retrieved.
 *
 * Payload is reported in characters, which is exact and tokenizer-independent.
 * A token estimate at 4 characters per token is included for orientation only;
 * the ratio is the number that matters and it barely moves across tokenizers.
 *
 * Usage:
 *   npm run build && node benchmarks/run.mjs [--questions n] [--out file.json]
 *
 * This hits the live web through whatever providers are configured, so runs
 * are not bit-reproducible: pages change, and DuckDuckGo rate-limits scrapers.
 * Failures are reported per question rather than aborting the run.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

/** Absolute paths must be file:// URLs for the ESM loader on Windows. */
const dist = (file) => pathToFileURL(join(root, "dist", file)).href;

const { runSearch } = await import(dist("tools/search.js"));
const { runResearch } = await import(dist("tools/research.js"));
const { getPage } = await import(dist("extraction/router.js"));

/** Characters per token, used only for the orientation estimate. */
const CHARS_PER_TOKEN = 4;

/** Top results a hand-driven agent would plausibly open. */
const BASELINE_PAGES = 5;

function parseArgs(argv) {
  const args = { questions: Infinity, out: join(here, "results", "latest.json") };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--questions") args.questions = Number(argv[++i]);
    else if (argv[i] === "--out") args.out = argv[++i];
  }
  return args;
}

const chars = (value) =>
  typeof value === "string" ? value.length : JSON.stringify(value ?? null).length;

const tokens = (n) => Math.round(n / CHARS_PER_TOKEN);

/**
 * What the agent-driven workflow puts in context: the search response it reads
 * to choose links, plus the full extracted content of each page it opens.
 */
async function baseline(question) {
  const search = await runSearch({ query: question, max_results: 10 });
  let payload = chars(search);
  const urls = search.sources.slice(0, BASELINE_PAGES).map((s) => s.url);

  let opened = 0;
  for (const url of urls) {
    try {
      const page = await getPage(url, {}, {});
      payload += chars(page.content) + chars(page.title) + chars(page.url);
      opened += 1;
    } catch {
      // An agent that cannot open a page simply moves on.
    }
  }
  return { payload, opened, found: search.sources.length };
}

async function measure(question) {
  const startBase = Date.now();
  const base = await baseline(question.text);
  const baseMs = Date.now() - startBase;

  const startResearch = Date.now();
  const research = await runResearch({ question: question.text });
  const researchMs = Date.now() - startResearch;
  const researchChars = chars(research);

  return {
    id: question.id,
    category: question.category,
    question: question.text,
    baseline_chars: base.payload,
    baseline_pages_opened: base.opened,
    baseline_ms: baseMs,
    research_chars: researchChars,
    research_ms: researchMs,
    sources_opened: research.evidence?.sources_opened ?? 0,
    independent_sources: research.evidence?.independent_sources ?? 0,
    cited_spans: research.evidence?.cited_spans ?? 0,
    query_term_coverage: research.evidence?.query_term_coverage ?? 0,
    reduction: base.payload > 0 ? 1 - researchChars / base.payload : 0,
  };
}

function summarize(rows) {
  const usable = rows.filter((r) => r.ok !== false && r.baseline_chars > 0);
  const sum = (key) => usable.reduce((total, row) => total + row[key], 0);
  const baselineChars = sum("baseline_chars");
  const researchChars = sum("research_chars");
  return {
    questions_attempted: rows.length,
    questions_measured: usable.length,
    baseline_chars: baselineChars,
    research_chars: researchChars,
    baseline_tokens_est: tokens(baselineChars),
    research_tokens_est: tokens(researchChars),
    reduction: baselineChars > 0 ? 1 - researchChars / baselineChars : 0,
    median_reduction: median(usable.map((r) => r.reduction)),
    baseline_ms_total: sum("baseline_ms"),
    research_ms_total: sum("research_ms"),
  };
}

function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
    : (sorted[mid] ?? 0);
}

const pct = (value) => `${(value * 100).toFixed(1)}%`;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { questions } = JSON.parse(
    readFileSync(join(here, "questions.json"), "utf8"),
  );
  const selected = questions.slice(0, args.questions);

  console.log(
    `Token-efficiency benchmark: ${selected.length} questions, ` +
      `baseline opens top ${BASELINE_PAGES} pages per question.\n`,
  );

  mkdirSync(dirname(args.out), { recursive: true });

  const rows = [];
  const save = () =>
    writeFileSync(
      args.out,
      `${JSON.stringify({ generated: new Date().toISOString(), summary: summarize(rows), rows }, null, 2)}\n`,
    );

  for (const question of selected) {
    const started = Date.now();
    try {
      const row = await measure(question);
      rows.push(row);
      // Written after every question so a slow or interrupted run still
      // leaves usable data behind, and so progress is observable when
      // stdout is piped and therefore fully buffered.
      save();
      console.log(
        `  ${question.id.padEnd(22)} baseline ${String(row.baseline_chars).padStart(7)}ch  ` +
          `research ${String(row.research_chars).padStart(6)}ch  ` +
          `-${pct(row.reduction).padStart(6)}  ` +
          `${row.independent_sources}/${row.sources_opened} indep  ` +
          `${Math.round((Date.now() - started) / 1000)}s`,
      );
    } catch (error) {
      rows.push({ id: question.id, ok: false, error: String(error) });
      save();
      console.log(
        `  ${question.id.padEnd(22)} FAILED: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  const summary = summarize(rows);
  save();

  console.log(`\n${"=".repeat(64)}`);
  console.log(`Measured        ${summary.questions_measured}/${summary.questions_attempted} questions`);
  console.log(`Baseline        ${summary.baseline_chars.toLocaleString()} chars  (~${summary.baseline_tokens_est.toLocaleString()} tokens)`);
  console.log(`web_research    ${summary.research_chars.toLocaleString()} chars  (~${summary.research_tokens_est.toLocaleString()} tokens)`);
  console.log(`Reduction       ${pct(summary.reduction)} overall, ${pct(summary.median_reduction)} median`);
  console.log(`${"=".repeat(64)}`);
  console.log(`\nReport written to ${args.out}`);

  if (summary.questions_measured === 0) {
    console.error(
      "\nNo questions could be measured. Providers returned nothing — " +
        "DuckDuckGo rate-limiting is the usual cause. Re-run later or set " +
        "BRAVE_API_KEY / TAVILY_API_KEY.",
    );
    process.exitCode = 1;
  }
}

await main();
