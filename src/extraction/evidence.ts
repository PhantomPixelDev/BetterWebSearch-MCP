/**
 * Evidence and fusion types shared by the AccessRouter and Content Fusion.
 *
 * An {@link Evidence} is a single piece of extracted content with a source
 * and a confidence score. The fusion pipeline collects evidence from several
 * strategies (HTTP readability, JSON-LD, Next.js hydration, browser API
 * capture, metadata) and merges them into one page extraction.
 */

/** The origin of a piece of extracted evidence. */
export type EvidenceSource =
  | "page"
  | "api"
  | "structured_data"
  | "search_snippet";

/** A single piece of extracted content with provenance and confidence. */
export interface Evidence {
  /** Where the evidence came from (page, api, structured data, snippet). */
  source: EvidenceSource;
  /** The kind of evidence, mirroring {@link EvidenceSource}. */
  type: EvidenceSource;
  /** Confidence in this evidence, 0..1. */
  confidence: number;
  /** The URL the evidence was extracted from. */
  url: string;
  /** A short snippet of the evidence, when available. */
  snippet?: string;
}

/** The extraction strategies the fusion pipeline can score. */
export type FusionMethod =
  | "api"
  | "jsonld"
  | "rendered"
  | "readability"
  | "metadata";

/** A single strategy's contribution to the fused result. */
export interface StrategyResult {
  /** The extraction method that produced this content. */
  method: FusionMethod;
  /** Confidence in this strategy's content, 0..1. */
  confidence: number;
  /** The extracted content (Markdown or plain text). */
  content: string;
  /** Structured data (JSON-LD / hydration) found by this strategy. */
  structured_data?: unknown;
  /** API endpoint payloads captured by this strategy. */
  api_endpoints?: unknown;
}

/** The final fused extraction returned to callers. */
export interface FusedContent {
  /** The page URL. */
  url: string;
  /** The page title. */
  title: string;
  /** The best content, chosen by confidence. */
  content: string;
  /** Metadata about the winning extraction method. */
  extraction: {
    /** The winning method name. */
    method: FusionMethod;
    /** The winning method's confidence, 0..1. */
    confidence: number;
    /** Whether the content required a browser render. */
    rendered: boolean;
  };
  /** Structured data merged from all strategies. */
  structured_data: unknown;
  /** API endpoint payloads merged from all strategies. */
  api_endpoints: unknown;
  /** Page metadata (title, description, published, author, siteName). */
  metadata: Record<string, string>;
}
