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

/** Words carrying no retrieval signal, skipped when scoring. */
const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from",
  "has", "have", "how", "i", "in", "is", "it", "its", "of", "on", "or", "s",
  "that", "the", "this", "to", "was", "were", "what", "when", "where", "which",
  "who", "why", "will", "with", "you", "your",
]);

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

  const flush = (): void => {
    const text = buffer.trim();
    if (text !== "") {
      passages.push({ text, start: bufferStart, end: bufferEnd, score: 0 });
    }
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
    buffer = buffer === "" ? paragraph : `${buffer}\n\n${paragraph}`;
    bufferEnd = index + paragraph.length;
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
  if (queryTerms.length === 0 || passages.length === 0) {
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
    for (const term of new Set(queryTerms)) {
      const freq = counts.get(term);
      if (freq === undefined) {
        continue;
      }
      const n = docFreq.get(term) ?? 0;
      // BM25 IDF, the +1 keeping it positive for terms in every passage.
      const idf = Math.log(1 + (docs.length - n + 0.5) / (n + 0.5));
      const norm = freq * (K1 + 1);
      const denom = freq + K1 * (1 - B + (B * doc.length) / (avgLength || 1));
      score += idf * (norm / denom);
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
