/**
 * Source independence via near-duplicate detection.
 *
 * URL deduplication only catches the same page twice. It does nothing about
 * syndication: a wire story republished by five outlets, a vendor press
 * release quoted verbatim, or an article and its own AMP variant all arrive as
 * distinct URLs. Counting those as five sources is how a research tool reports
 * strong agreement for what is really one claim from one author.
 *
 * Pages are compared by content shingles here, and near-duplicates are grouped
 * into clusters with one primary per cluster. Callers can then say "three
 * independent sources, two derivative" instead of "five sources", and citation
 * selection can spread across clusters rather than across URLs.
 *
 * The comparison is Jaccard similarity over word shingles: deterministic,
 * language-agnostic, and cheap at the page counts involved (research opens at
 * most ten, so the quadratic comparison is a few dozen set intersections).
 */

/** Words per shingle. Long enough to be distinctive, short enough to survive edits. */
export const SHINGLE_SIZE = 5;

/** Jaccard similarity at or above which two documents are near-duplicates. */
export const DUPLICATE_THRESHOLD = 0.4;

/** Minimum tokens a document needs before similarity means anything. */
const MIN_TOKENS = SHINGLE_SIZE * 4;

/** A document participating in independence analysis. */
export interface IndependenceInput {
  /** The source URL, used to derive the registrable-ish host. */
  url: string;
  /** The extracted page content. */
  content: string;
}

/** Where a document sits among its near-duplicates. */
export interface IndependenceResult {
  /** Index of the cluster this document belongs to. */
  cluster: number;
  /**
   * Whether this is the representative of its cluster. Exactly one document
   * per cluster is primary; the rest are derivative copies of the same text.
   */
  primary: boolean;
  /** How many other documents share this cluster. */
  duplicates: number;
}

/** Lowercase word tokens used to build shingles. */
function tokens(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

/**
 * Build the set of word shingles for a document.
 *
 * Exported for testing; callers normally use {@link analyzeIndependence}.
 */
export function shingles(text: string, size = SHINGLE_SIZE): Set<string> {
  const words = tokens(text);
  const set = new Set<string>();
  if (words.length < size) {
    // Too short to shingle: fall back to the whole token string so identical
    // short documents still match each other.
    if (words.length > 0) {
      set.add(words.join(" "));
    }
    return set;
  }
  for (let i = 0; i + size <= words.length; i += 1) {
    set.add(words.slice(i, i + size).join(" "));
  }
  return set;
}

/** Jaccard similarity of two sets: |intersection| / |union|. */
export function jaccard(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  if (a.size === 0 || b.size === 0) {
    return 0;
  }
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let intersection = 0;
  for (const value of small) {
    if (large.has(value)) {
      intersection += 1;
    }
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** The host of a URL, lowercased and stripped of a leading `www.`. */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * Group documents into clusters of near-duplicates.
 *
 * Two documents join the same cluster when their shingle sets reach
 * {@link DUPLICATE_THRESHOLD}, or when they share a host — the same site
 * publishing two pages on a topic is not two independent confirmations.
 * Clustering is transitive via union-find, so A~B and B~C puts all three
 * together even when A and C alone fall below the threshold.
 *
 * The first document in each cluster is its primary, which keeps the incoming
 * relevance order meaningful: callers rank before calling this.
 *
 * @param docs Documents in the caller's preferred (usually ranked) order.
 * @returns One result per input document, in the same order.
 */
export function analyzeIndependence(
  docs: readonly IndependenceInput[],
): IndependenceResult[] {
  const parent = docs.map((_, index) => index);

  const find = (index: number): number => {
    let root = index;
    while (parent[root] !== root) {
      root = parent[root] ?? root;
    }
    // Path compression keeps repeated lookups cheap.
    let cursor = index;
    while (parent[cursor] !== root) {
      const next = parent[cursor] ?? root;
      parent[cursor] = root;
      cursor = next;
    }
    return root;
  };

  const union = (a: number, b: number): void => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) {
      // Always attach to the lower index so the earliest document wins.
      const [keep, drop] = rootA < rootB ? [rootA, rootB] : [rootB, rootA];
      parent[drop] = keep;
    }
  };

  const fingerprints = docs.map((doc) => shingles(doc.content));
  const hosts = docs.map((doc) => hostOf(doc.url));
  const lengths = docs.map((doc) => tokens(doc.content).length);

  for (let i = 0; i < docs.length; i += 1) {
    for (let j = i + 1; j < docs.length; j += 1) {
      const sameHost =
        hosts[i] !== "" && hosts[i] === hosts[j];
      if (sameHost) {
        union(i, j);
        continue;
      }
      // Documents too short to fingerprint are left independent rather than
      // collapsed on a coincidental match.
      if ((lengths[i] ?? 0) < MIN_TOKENS || (lengths[j] ?? 0) < MIN_TOKENS) {
        continue;
      }
      const similarity = jaccard(
        fingerprints[i] ?? new Set(),
        fingerprints[j] ?? new Set(),
      );
      if (similarity >= DUPLICATE_THRESHOLD) {
        union(i, j);
      }
    }
  }

  // Number clusters by first appearance so output is stable and readable.
  const clusterIds = new Map<number, number>();
  const members = new Map<number, number>();
  const roots = docs.map((_, index) => find(index));
  for (const root of roots) {
    if (!clusterIds.has(root)) {
      clusterIds.set(root, clusterIds.size);
    }
    members.set(root, (members.get(root) ?? 0) + 1);
  }

  return docs.map((_, index) => {
    const root = roots[index] ?? index;
    return {
      cluster: clusterIds.get(root) ?? 0,
      primary: root === index,
      duplicates: (members.get(root) ?? 1) - 1,
    };
  });
}

/** How many distinct clusters a set of independence results spans. */
export function countIndependent(
  results: readonly IndependenceResult[],
): number {
  return new Set(results.map((result) => result.cluster)).size;
}
