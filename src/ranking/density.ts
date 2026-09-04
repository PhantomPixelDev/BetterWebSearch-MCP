/**
 * Information density scoring.
 *
 * A large share of search results are listicles and content-farm pages: four
 * thousand words of padding wrapped around two useful sentences, plus a wall
 * of navigation and affiliate links. They rank well and read badly, and by
 * character count they crowd out better sources.
 *
 * The signals here are structural rather than semantic, which keeps them
 * deterministic and cheap: link-to-text ratio, repeated paragraphs, sentence
 * length distribution, and the share of lines that are navigation furniture.
 * None of them decides anything on its own — the score is a ranking nudge,
 * not a filter, because a legitimate reference page can be link-heavy and a
 * short page can be excellent.
 */

/** The component signals behind a density score. */
export interface DensitySignals {
  /** Words of visible text, after stripping markdown link syntax. */
  words: number;
  /** Markdown links per 100 words. High on navigation and affiliate pages. */
  linkRatio: number;
  /** Share of paragraphs that duplicate an earlier one, 0..1. */
  duplicateRatio: number;
  /** Share of lines that look like navigation or boilerplate, 0..1. */
  boilerplateRatio: number;
  /** Mean sentence length in words. */
  meanSentenceWords: number;
}

/** A density verdict for one page. */
export interface DensityResult extends DensitySignals {
  /**
   * Information density, 0..1. Higher means more substance per character.
   * Intended as a ranking signal alongside relevance, not a gate.
   */
  score: number;
}

/** Lines this short are almost always nav items, labels, or list chrome. */
const SHORT_LINE_WORDS = 4;

/** Link ratio at or above which a page reads as navigation rather than prose. */
const HIGH_LINK_RATIO = 12;

/** Markdown link syntax, used both to count links and to strip them. */
const MARKDOWN_LINK = /\[([^\]]*)\]\([^)]*\)/g;

/** Lines that are navigation furniture rather than content. */
const BOILERPLATE_LINE =
  /^\s*(?:home|menu|search|share|tweet|subscribe|sign\s?up|log\s?in|newsletter|advertisement|sponsored|related\s+(?:posts|articles)|read\s+more|next|previous|back\s+to\s+top|cookie|privacy\s+policy|terms(?:\s+of\s+service)?|all\s+rights\s+reserved|follow\s+us|table\s+of\s+contents)\b/i;

/** Count words in a string. */
function wordCount(text: string): number {
  return (text.match(/[A-Za-z0-9][A-Za-z0-9'-]*/g) ?? []).length;
}

/** Normalize a paragraph for duplicate comparison. */
function normalizeParagraph(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Measure the structural signals of a page's extracted content.
 *
 * Exported so the score can be explained rather than just asserted.
 */
export function densitySignals(content: string): DensitySignals {
  const links = (content.match(MARKDOWN_LINK) ?? []).length;
  // Keep link *text*, drop the target, so URLs do not inflate the word count.
  const stripped = content.replace(MARKDOWN_LINK, "$1");
  const words = wordCount(stripped);

  const lines = stripped
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");

  const boilerplate = lines.filter(
    (line) =>
      BOILERPLATE_LINE.test(line) || wordCount(line) <= SHORT_LINE_WORDS,
  ).length;

  const paragraphs = stripped
    .split(/\n\s*\n/)
    .map(normalizeParagraph)
    .filter((paragraph) => wordCount(paragraph) > SHORT_LINE_WORDS);
  const seen = new Set<string>();
  let duplicates = 0;
  for (const paragraph of paragraphs) {
    if (seen.has(paragraph)) {
      duplicates += 1;
    }
    seen.add(paragraph);
  }

  const sentences = stripped
    .split(/[.!?]+\s/)
    .map(wordCount)
    .filter((count) => count > 0);
  const meanSentenceWords =
    sentences.length === 0
      ? 0
      : sentences.reduce((total, count) => total + count, 0) / sentences.length;

  return {
    words,
    linkRatio: words === 0 ? 0 : (links / words) * 100,
    duplicateRatio: paragraphs.length === 0 ? 0 : duplicates / paragraphs.length,
    boilerplateRatio: lines.length === 0 ? 0 : boilerplate / lines.length,
    meanSentenceWords,
  };
}

/**
 * Punctuation share above which text reads as serialized data, not prose.
 *
 * Hydration payloads are mostly braces, quotes, colons and commas; English
 * prose sits far below this even when it contains code.
 */
const SERIALIZED_PUNCTUATION_RATIO = 0.12;

/** Minimum length before the ratio means anything. */
const SERIALIZED_MIN_CHARS = 80;

/**
 * Whether text is a serialized data blob rather than readable content.
 *
 * Extraction sometimes leaves `__NEXT_DATA__`-style payloads in the page text,
 * and they score well: they repeat every query term the article uses, so they
 * won citation slots and spent an agent's context on `{"props":{"pageProps"…`.
 * Quoting one is pure waste, since nothing in it is prose an agent can read.
 *
 * The test is deliberately narrow. A fenced code sample or a config snippet is
 * legitimate evidence for a developer question, so it requires both a high
 * punctuation share and the quoted-key shape that marks JSON.
 */
export function looksLikeSerializedData(text: string): boolean {
  if (text.length < SERIALIZED_MIN_CHARS) {
    return false;
  }
  const punctuation = (text.match(/[{}[\]":,]/g) ?? []).length;
  if (punctuation / text.length < SERIALIZED_PUNCTUATION_RATIO) {
    return false;
  }
  // Quoted keys mapping to values: the signature of a serialized object.
  const quotedKeys = (text.match(/"[^"]{1,60}"\s*:/g) ?? []).length;
  return quotedKeys >= 3;
}

/** Clamp to the 0..1 range. */
function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * Score a page's information density from its extracted content.
 *
 * Penalties are additive and capped, so one bad signal cannot zero a page that
 * is otherwise substantial. An empty page scores 0.
 */
export function informationDensity(content: string): DensityResult {
  const signals = densitySignals(content);
  if (signals.words === 0) {
    return { ...signals, score: 0 };
  }

  // Navigation and affiliate pages carry far more links per word than prose.
  const linkPenalty = clamp01(signals.linkRatio / HIGH_LINK_RATIO) * 0.35;
  // Repeated paragraphs are the signature of templated filler.
  const duplicatePenalty = signals.duplicateRatio * 0.25;
  // A page that is mostly short lines is a menu, not an article.
  const boilerplatePenalty = clamp01(signals.boilerplateRatio) * 0.3;
  // Very short mean sentences suggest fragments and list chrome; very long
  // ones suggest unbroken padding. Both are mild signals, so the weight is low.
  const sentencePenalty =
    signals.meanSentenceWords === 0
      ? 0.1
      : clamp01(Math.abs(signals.meanSentenceWords - 18) / 30) * 0.1;

  const score = clamp01(
    1 - linkPenalty - duplicatePenalty - boilerplatePenalty - sentencePenalty,
  );

  return { ...signals, score: Number(score.toFixed(4)) };
}
