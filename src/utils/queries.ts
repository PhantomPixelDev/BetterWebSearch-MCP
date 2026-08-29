/**
 * Query expansion utilities.
 *
 * `expandQueries` rewrites a single question into 4-6 search variants using
 * a small synonym dictionary plus German translations for generic English
 * queries. It is purely rule-based — no LLM involved.
 */

/** A synonym group: the trigger term and its replacement variants. */
interface SynonymGroup {
  /** Lowercase trigger term to match in the question. */
  term: string;
  /** Replacement terms, each producing one variant. */
  replacements: readonly string[];
}

/**
 * Small curated synonym dictionary. Each group maps a trigger term to one or
 * more replacement terms. German translations are included for generic
 * English queries (e.g. "unlimited mobile internet Germany").
 */
const SYNONYMS: readonly SynonymGroup[] = [
  // German translations first so generic English queries get their DE
  // variants before the variant cap is reached.
  { term: "germany", replacements: ["Germany", "Deutschland"] },
  { term: "deutschland", replacements: ["Deutschland", "Germany"] },
  { term: "unlimited", replacements: ["unlimited", "unbegrenztes"] },
  { term: "mobile internet", replacements: ["mobile internet", "Datenvolumen"] },
  { term: "internet", replacements: ["internet", "Datenvolumen"] },
  { term: "cheap", replacements: ["cheapest", "affordable", "günstig"] },
  { term: "cheapest", replacements: ["cheap", "affordable"] },
  { term: "affordable", replacements: ["cheap", "cheapest"] },
  { term: "best", replacements: ["best", "top", "beste"] },
  { term: "top", replacements: ["best", "top"] },
  { term: "how to", replacements: ["how to", "guide", "tutorial"] },
  { term: "guide", replacements: ["guide", "how to"] },
  { term: "tutorial", replacements: ["tutorial", "guide"] },
  { term: "review", replacements: ["review", "reviews", "comparison"] },
  { term: "compare", replacements: ["compare", "comparison", "vs"] },
  { term: "price", replacements: ["price", "cost", "preis"] },
];

/**
 * Expand a question into 4-6 unique search variants.
 *
 * The original question is always first. Each matching synonym group adds a
 * variant with the term replaced. Variants are deduplicated (case-insensitive)
 * and the list is capped to 6.
 *
 * Returns `[""]` for an empty question.
 */
export function expandQueries(question: string): string[] {
  const trimmed = question.trim();
  if (trimmed === "") {
    return [""];
  }

  const variants: string[] = [trimmed];
  const seen = new Set<string>([trimmed.toLowerCase()]);

  for (const group of SYNONYMS) {
    if (variants.length >= 6) {
      break;
    }
    const lower = trimmed.toLowerCase();
    if (!lower.includes(group.term)) {
      continue;
    }
    for (const replacement of group.replacements) {
      if (variants.length >= 6) {
        break;
      }
      const variant = replaceTerm(trimmed, group.term, replacement);
      const key = variant.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        variants.push(variant);
      }
    }
  }

  return variants;
}

/** Replace a whole-word (case-insensitive) term in a string. */
function replaceTerm(input: string, term: string, replacement: string): string {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`\\b${escaped}\\b`, "gi");
  return input.replace(pattern, replacement);
}
