import type { SearchOptions, SearchProvider, SearchResult } from "./types.js";

const BRAVE_ENDPOINT = "https://api.search.brave.com/res/v1/web/search";
const TIMEOUT_MS = 8_000;

/**
 * Map a number of days to a Brave `freshness` filter value.
 *
 * Brave accepts "pd" (past day), "pw" (past week), "pm" (past month),
 * "py" (past year), or an explicit "YYYY-MM-DDtoYYYY-MM-DD" range. We map
 * common day counts to the coarse tokens and fall back to a date range for
 * anything else.
 */
export function freshnessFromRecencyDays(days: number): string | undefined {
  if (!Number.isFinite(days) || days <= 0) {
    return undefined;
  }
  if (days <= 1) {
    return "pd";
  }
  if (days <= 7) {
    return "pw";
  }
  if (days <= 30) {
    return "pm";
  }
  if (days <= 365) {
    return "py";
  }
  // Beyond a year, express as an explicit date range from today back `days`.
  const from = new Date(Date.now() - days * 86_400_000);
  const to = new Date();
  const fmt = (d: Date): string => d.toISOString().slice(0, 10);
  return `${fmt(from)}to${fmt(to)}`;
}

interface BraveWebResult {
  title?: string;
  url?: string;
  description?: string;
  extra_snippets?: string[];
  age?: string;
}

interface BraveApiResponse {
  web?: {
    results?: BraveWebResult[];
  };
}

/** Build the snippet from description plus any extra snippets. */
function buildSnippet(result: BraveWebResult): string {
  const parts: string[] = [];
  if (result.description) {
    parts.push(result.description);
  }
  if (result.extra_snippets && result.extra_snippets.length > 0) {
    parts.push(...result.extra_snippets);
  }
  return parts.join(" ");
}

/**
 * Brave Search provider (primary).
 *
 * Requires `BRAVE_API_KEY` in the environment. When the key is missing, or
 * the API returns an auth/rate-limit error, it returns an empty array and
 * logs a warning rather than throwing.
 */
export class BraveProvider implements SearchProvider {
  readonly name = "brave";

  async search(query: string, opts: SearchOptions): Promise<SearchResult[]> {
    const { loadConfig } = await import("../utils/config.js");
    const apiKey = loadConfig().braveApiKey;
    if (!apiKey) {
      console.warn("[brave] BRAVE_API_KEY is not set; returning no results.");
      return [];
    }

    const params = new URLSearchParams({ q: query });
    if (opts.count) {
      params.set("count", String(opts.count));
    }
    const freshness =
      opts.freshness ?? freshnessFromRecencyDays(opts.recency_days ?? 0);
    if (freshness) {
      params.set("freshness", freshness);
    }
    if (opts.extraSnippets) {
      params.set("extra_snippets", "true");
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(`${BRAVE_ENDPOINT}?${params.toString()}`, {
        headers: {
          "X-Subscription-Token": apiKey,
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      if (response.status === 401 || response.status === 429) {
        console.warn(
          `[brave] API returned ${response.status}; returning no results.`,
        );
        return [];
      }
      if (!response.ok) {
        console.warn(
          `[brave] API returned ${response.status}; returning no results.`,
        );
        return [];
      }

      const data = (await response.json()) as BraveApiResponse;
      const results = data.web?.results ?? [];
      return results
        .filter((r) => r.url && r.title)
        .map((r) => ({
          title: r.title ?? "",
          url: r.url ?? "",
          snippet: buildSnippet(r),
          published: r.age,
          source: this.name,
        }));
    } catch (error) {
      console.warn(
        `[brave] search failed (${error instanceof Error ? error.message : String(error)}); returning no results.`,
      );
      return [];
    } finally {
      clearTimeout(timer);
    }
  }
}
