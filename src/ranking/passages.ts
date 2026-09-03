/**
 * Query-relevant passage selection with citation anchors.
 *
 * `web_research` used to build its answer by taking the first 400 characters
 * of each of the top pages. That text is whatever the page opens with — a nav
 * blurb, a cookie notice, an intro paragraph — and the question was never
 * consulted, so the "answer" frequently contained nothing that addressed it.
 *
 * This module scores passages against the question instead, using BM25 over
 * the candidate passages. That keeps the whole thing deterministic and
 * dependency-free: the calling agent is the language model, and its job gets
 * easier when it receives the few paragraphs that actually mention the query
 * terms rather than the top of every page.
 *
 * Each selected passage carries its character offsets in the source content,
 * so a citation can point at the exact span that supports a claim.
 */

/** A scored span of text taken from a page. */
export interface Passage {
  /** The passage text, trimmed. */
  text: string;
  /** Character offset of the passage start within the source content. */
  start: number;
  /** Character offset of the passage end within the source content. */
  end: number;
  /** BM25 score against the query. Higher is more relevant. */
  score: number;
}

/** Tuning constants for BM25. Standard defaults. */
const K1 = 1.5;
const B = 0.75;

/** Target passage size in characters; paragraphs are packed up to this. */
export const TARGET_PASSAGE_CHARS = 500;

/**
 * Hard ceiling on a single passage, in characters.
 *
 * Paragraph splitting alone is not enough: plenty of extracted pages contain
 * no blank lines at all, which made the whole page one passage. A cited
 * "passage" was then the entire document, and `web_research` returned more
 * text than reading the pages directly would have. Anything longer than this
 * is windowed on sentence boundaries.
 */
export const MAX_PASSAGE_CHARS = 1_200;

/** Words carrying no retrieval signal, skipped when scoring. */
const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from",
  "has", "have", "how", "i", "in", "is", "it", "its", "of", "on", "or", "s",
  "that", "the", "this", "to", "was", "were", "what", "when", "where", "which",
  "who", "why", "will", "with", "you", "your",
]);

/**
 * Shortest acronym worth expanding.
 *
 * Two-letter sequences match far too much ordinary prose to be a useful
 * signal, so only three letters and up are considered.
 */
const MIN_ACRONYM_LENGTH = 3;

/** Longest acronym worth expanding; beyond this the regex is noise. */
const MAX_ACRONYM_LENGTH = 8;

/**
 * Weight of an acronym-expansion match, as a multiple of the mean query IDF.
 *
 * Expressed relative to the query's own IDF so it stays comparable to BM25
 * scores instead of being a magic constant tuned to one corpus.
 */
const ACRONYM_EXPANSION_WEIGHT = 1.5;

/** Words allowed between expansion initials without breaking the match. */
const CONNECTORS = "(?:of|and|the|for|in|to|a)";

/**
 * Uppercase acronyms appearing in a query, e.g. "TLS" from "What does TLS
 * stand for?".
 */
export function findAcronyms(query: string): string[] {
  const found =
    query.match(
      new RegExp(`\\b[A-Z]{${MIN_ACRONYM_LENGTH},${MAX_ACRONYM_LENGTH}}\\b`, "g"),
    ) ?? [];
  return [...new Set(found)];
}

/**
 * Whether `text` contains a phrase whose initials spell `acronym`.
 *
 * "Transport Layer Security" expands TLS; "Atomicity, Consistency, Isolation,
 * Durability" expands ACID. Separators allow the punctuation these lists are
 * usually written with, and a short connector word may sit between initials
 * so "Cross-Origin Resource Sharing" and similar still match.
 *
 * This exists because the expansion is exactly the text a lexical scorer
 * cannot find: the sentence that answers "what does TLS stand for" frequently
 * never repeats the letters TLS, so it shares no term with the query and is
 * dropped before ranking.
 */
export function expandsAcronym(text: string, acronym: string): boolean {
  const letters = [...acronym.toUpperCase()];
  if (letters.length < MIN_ACRONYM_LENGTH) {
    return false;
  }
  // Between initials: run out the current word, then optionally a separator
  // and a connector. Letting the separator be optional is what allows a
  // compound word to supply two initials, as "HyperText" does for HTML.
  const gap = `[a-z]*(?:[\\s,;:/()-]+(?:${CONNECTORS}[\\s,;:/()-]+)?)?`;
  const pattern = letters.join(gap) + "[a-z]*";
  const regex = new RegExp(`\\b${pattern}\\b`, "gi");

  // Every gap may be empty, so the pattern also matches the bare acronym —
  // "TLS" itself satisfies T[a-z]*L[a-z]*S[a-z]*. Without this length floor
  // any passage merely mentioning the acronym would count as expanding it,
  // and the bonus would apply everywhere and rank nothing.
  const minLength = acronym.length * 2;
  for (const match of text.matchAll(regex)) {
    const found = match[0];
    if (
      found.length >= minLength &&
      found.toUpperCase() !== acronym.toUpperCase()
    ) {
      return true;
    }
  }
  return false;
}

/** Lowercase alphanumeric tokens, stop words removed. */
export function tokenize(text: string): string[] {
  const tokens = text.toLowerCase().match(/[a-z0-9_]+/g) ?? [];
  return tokens.filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

/**
 * Split content into passage-sized chunks on paragraph boundaries.
 *
 * Markdown from the extraction pipeline is paragraph-separated, so blank lines
 * are the natural split. Short paragraphs are packed together up to
 * {@link TARGET_PASSAGE_CHARS} so a one-line heading is not its own passage,
 * and an over-long paragraph is emitted whole rather than cut mid-sentence.
 */
export function splitPassages(content: string): Passage[] {
  const passages: Passage[] = [];
  const paragraphRe = /[^\n]+(?:\n(?!\s*\n)[^\n]+)*/g;

  let bufferStart = -1;
  let bufferEnd = -1;
  let buffer = "";

  /**
   * Record a passage, keeping `start`/`end` addressing the exact span.
   *
   * Trimming the text without moving the offsets would break the contract that
   * `content.slice(start, end) === text`, which is what makes a citation
   * anchor verifiable.
   */
  const push = (raw: string, start: number): void => {
    const leading = raw.length - raw.trimStart().length;
    const text = raw.trim();
    if (text === "") {
      return;
    }
    const from = start + leading;
    passages.push({ text, start: from, end: from + text.length, score: 0 });
  };

  const emit = (text: string, start: number, end: number): void => {
    void end;
    if (text.trim() === "") {
      return;
    }
    if (text.length <= MAX_PASSAGE_CHARS) {
      push(text, start);
      return;
    }
    // Window an over-long block on sentence boundaries, keeping offsets
    // accurate by tracking position in the original string.
    let windowStart = 0;
    while (windowStart < text.length) {
      let windowEnd = Math.min(windowStart + MAX_PASSAGE_CHARS, text.length);
      if (windowEnd < text.length) {
        // Prefer the last sentence end inside the window; fall back to a
        // space so words are never cut in half.
        const slice = text.slice(windowStart, windowEnd);
        const sentence = slice.lastIndexOf(". ");
        const space = slice.lastIndexOf(" ");
        const cut = sentence > MAX_PASSAGE_CHARS / 2 ? sentence + 1 : space;
        if (cut > 0) {
          windowEnd = windowStart + cut;
        }
      }
      push(text.slice(windowStart, windowEnd), start + windowStart);
      windowStart = windowEnd;
    }
  };

  const flush = (): void => {
    emit(buffer, bufferStart, bufferEnd);
    buffer = "";
    bufferStart = -1;
    bufferEnd = -1;
  };

  for (const match of content.matchAll(paragraphRe)) {
    const paragraph = match[0];
    const index = match.index ?? 0;
    if (paragraph.trim() === "") {
      continue;
    }
    if (buffer === "") {
      bufferStart = index;
    } else if (buffer.length + paragraph.length > TARGET_PASSAGE_CHARS) {
      flush();
      bufferStart = index;
    }
    bufferEnd = index + paragraph.length;
    // Slice the original rather than rejoining with a literal "\n\n": the
    // source separator may be "\n\n\n" or "\n \n", and rebuilding the text
    // would leave it a different length from the span start/end describe.
    buffer = content.slice(bufferStart, bufferEnd);
    if (buffer.length >= TARGET_PASSAGE_CHARS) {
      flush();
    }
  }
  flush();

  return passages;
}

/**
 * Score `passages` against `query` with BM25 and return them ranked.
 *
 * Passages that share no query term score 0 and are dropped: returning a
 * passage with nothing in common with the question is what the old
 * first-400-characters approach did.
 */
export function rankPassages(
  passages: readonly Passage[],
  query: string,
): Passage[] {
  const queryTerms = tokenize(query);
  const acronyms = findAcronyms(query).filter((acronym) =>
    // An acronym the query also spells out needs no special handling.
    queryTerms.includes(acronym.toLowerCase()),
  );
  if ((queryTerms.length === 0 && acronyms.length === 0) || passages.length === 0) {
    return [];
  }

  const docs = passages.map((passage) => tokenize(passage.text));
  const avgLength =
    docs.reduce((sum, doc) => sum + doc.length, 0) / (docs.length || 1);

  // Document frequency per query term across the candidate passages.
  const docFreq = new Map<string, number>();
  for (const term of new Set(queryTerms)) {
    let count = 0;
    for (const doc of docs) {
      if (doc.includes(term)) {
        count += 1;
      }
    }
    docFreq.set(term, count);
  }

  // Sized from the query's own IDF so the bonus stays comparable to the BM25
  // scores it is added to, rather than being a constant tuned to one corpus.
  const idfOf = (term: string): number => {
    const n = docFreq.get(term) ?? 0;
    return Math.log(1 + (docs.length - n + 0.5) / (n + 0.5));
  };
  const uniqueTerms = [...new Set(queryTerms)];
  const meanIdf =
    uniqueTerms.length === 0
      ? 1
      : uniqueTerms.reduce((total, term) => total + idfOf(term), 0) /
        uniqueTerms.length;
  const expansionBonus = ACRONYM_EXPANSION_WEIGHT * meanIdf;

  const scored: Passage[] = [];
  passages.forEach((passage, index) => {
    const doc = docs[index] ?? [];
    if (doc.length === 0) {
      return;
    }
    const counts = new Map<string, number>();
    for (const token of doc) {
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }

    let score = 0;
    for (const term of uniqueTerms) {
      const freq = counts.get(term);
      if (freq === undefined) {
        continue;
      }
      // BM25 IDF, the +1 keeping it positive for terms in every passage.
      const idf = idfOf(term);
      const norm = freq * (K1 + 1);
      const denom = freq + K1 * (1 - B + (B * doc.length) / (avgLength || 1));
      score += idf * (norm / denom);
    }

    // A passage that spells an acronym out is usually the one answering "what
    // does X stand for", but it says the expansion once while pages that merely
    // use the acronym repeat it, so BM25 ranks the answer below the noise.
    //
    // The expansion must sit alongside the acronym itself. The loose gap that
    // lets "HyperText Markup Language" expand HTML also matches ordinary prose
    // — "The lazy squirrel" expands TLS — and requiring the acronym in the same
    // passage removes those without weakening the real case, since the answer
    // sentence almost always names the acronym it is defining.
    if (
      acronyms.some(
        (acronym) =>
          counts.has(acronym.toLowerCase()) &&
          expandsAcronym(passage.text, acronym),
      )
    ) {
      score += expansionBonus;
    }

    if (score > 0) {
      scored.push({ ...passage, score });
    }
  });

  return scored.sort((a, b) => b.score - a.score);
}

/**
 * Select the passages of `content` most relevant to `query`.
 *
 * @param content The extracted page content.
 * @param query The user's question.
 * @param limit Maximum passages to return.
 */
export function selectPassages(
  content: string,
  query: string,
  limit = 2,
): Passage[] {
  return rankPassages(splitPassages(content), query).slice(0, limit);
}
