/**
 * Curated domain-quality scoring.
 *
 * Returns a 0-1 score for a hostname based on a curated tier list, using
 * suffix matching so `en.wikipedia.org` and `www.arxiv.org` both match their
 * base domains. Unknown domains fall back to a neutral default.
 */

/** A single tier: the base domain and its quality score. */
interface DomainTier {
  /** Base domain, e.g. "wikipedia.org". */
  domain: string;
  /** Quality score in [0, 1]. */
  score: number;
}

/** High-authority reference domains. */
const HIGH_TIERS: readonly DomainTier[] = [
  { domain: "wikipedia.org", score: 0.95 },
  { domain: "arxiv.org", score: 0.95 },
  { domain: "developer.mozilla.org", score: 0.95 },
  { domain: "stackoverflow.com", score: 0.95 },
  { domain: "stackexchange.com", score: 0.9 },
  { domain: "github.com", score: 0.9 },
  { domain: "gov", score: 0.9 },
  { domain: "edu", score: 0.9 },
  { domain: "w3.org", score: 0.9 },
  { domain: "ietf.org", score: 0.9 },
  { domain: "npmjs.com", score: 0.9 },
  { domain: "caniuse.com", score: 0.9 },
  { domain: "mdn.dev", score: 0.9 },
];

/** Medium-authority news / tech domains. */
const MEDIUM_TIERS: readonly DomainTier[] = [
  { domain: "nytimes.com", score: 0.7 },
  { domain: "theguardian.com", score: 0.7 },
  { domain: "bbc.com", score: 0.7 },
  { domain: "bbc.co.uk", score: 0.7 },
  { domain: "reuters.com", score: 0.7 },
  { domain: "apnews.com", score: 0.7 },
  { domain: "wired.com", score: 0.7 },
  { domain: "techcrunch.com", score: 0.7 },
  { domain: "theverge.com", score: 0.7 },
  { domain: "arstechnica.com", score: 0.7 },
  { domain: "medium.com", score: 0.7 },
  { domain: "dev.to", score: 0.7 },
  { domain: "reddit.com", score: 0.7 },
  { domain: "quora.com", score: 0.7 },
  { domain: "forbes.com", score: 0.7 },
  { domain: "bloomberg.com", score: 0.7 },
  { domain: "cnn.com", score: 0.7 },
  { domain: "wsj.com", score: 0.7 },
  { domain: "ft.com", score: 0.7 },
  { domain: "economist.com", score: 0.7 },
];

/** Low-authority / spammy domains. */
const LOW_TIERS: readonly DomainTier[] = [
  { domain: "pinterest.com", score: 0.3 },
  { domain: "tiktok.com", score: 0.3 },
  { domain: "instagram.com", score: 0.3 },
  { domain: "facebook.com", score: 0.3 },
  { domain: "buzzfeed.com", score: 0.3 },
  { domain: "clickbait.com", score: 0.3 },
];

/** Default score for unknown domains. */
const DEFAULT_SCORE = 0.5;

/**
 * Score a hostname against the curated tiers using suffix matching.
 *
 * Accepts either a full URL or a bare hostname. Returns a value in [0, 1].
 */
export function domainScore(urlOrHost: string): number {
  const host = extractHost(urlOrHost);
  if (host === undefined) {
    return DEFAULT_SCORE;
  }

  const match = findTier(host);
  return match?.score ?? DEFAULT_SCORE;
}

/** Extract a lowercase hostname from a URL or bare host string. */
function extractHost(urlOrHost: string): string | undefined {
  const trimmed = urlOrHost.trim();
  if (trimmed === "") {
    return undefined;
  }
  // Bare host (no scheme) — parse directly.
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  try {
    return new URL(trimmed).hostname.toLowerCase();
  } catch {
    return undefined;
  }
}

/** Find the best-matching tier for a hostname by suffix. */
function findTier(host: string): DomainTier | undefined {
  const candidates = [...HIGH_TIERS, ...MEDIUM_TIERS, ...LOW_TIERS];
  let best: DomainTier | undefined;
  for (const tier of candidates) {
    if (host === tier.domain || host.endsWith(`.${tier.domain}`)) {
      // Prefer the longest matching suffix (most specific tier).
      if (best === undefined || tier.domain.length > best.domain.length) {
        best = tier;
      }
    }
  }
  return best;
}
