/**
 * Smoke harness for the MCP tool handlers.
 *
 * Calls each tool's `run*` handler directly (no MCP transport) and prints the
 * spec-shaped JSON to stdout. Run with:
 *
 *   npx tsx scripts/smoke.mjs
 *
 * The handlers hit real providers (DuckDuckGo is keyless), so results depend
 * on network availability; the harness prints whatever comes back without
 * crashing.
 */

import { runSearch } from "../src/tools/search.js";
import { runExtract } from "../src/tools/extract.js";
import { runFind } from "../src/tools/find.js";
import { runNews } from "../src/tools/news.js";

async function main() {
  console.log("=== web_search ===");
  const search = await runSearch({ query: "Laravel 12 authentication", max_results: 3 });
  console.log(JSON.stringify(search, null, 2));

  console.log("\n=== web_find ===");
  const find = await runFind({ query: "authentication", site: "laravel.com", max_results: 3 });
  console.log(JSON.stringify(find, null, 2));

  console.log("\n=== web_news ===");
  const news = await runNews({ topic: "artificial intelligence", recency_days: 7, max_results: 3 });
  console.log(JSON.stringify(news, null, 2));

  console.log("\n=== web_extract ===");
  const extract = await runExtract({
    urls: ["https://example.com"],
    mode: "fast",
  });
  console.log(JSON.stringify(extract, null, 2));
}

main().catch((error) => {
  console.error("Smoke harness failed:", error);
  process.exit(1);
});
