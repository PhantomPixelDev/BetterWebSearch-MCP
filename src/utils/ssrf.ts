/**
 * SSRF guards for outbound page fetching.
 *
 * `web_extract` takes URLs straight from the calling agent, and search results
 * are attacker-influenced text, so a page can steer an agent into fetching
 * whatever it likes. Without a guard that includes `http://localhost:8080/`,
 * `http://192.168.1.1/`, and the cloud metadata endpoint at
 * `http://169.254.169.254/`, whose contents would come back as ordinary
 * extracted "page content".
 *
 * The checks are deliberately deterministic and dependency-free: parse the
 * URL, reject non-HTTP schemes, resolve the hostname, and refuse any address
 * in a private, loopback, link-local, or otherwise non-public range. Callers
 * must re-run {@link assertPublicUrl} on every redirect hop, since only the
 * first URL is under their control.
 */

import { lookup } from "node:dns/promises";

/** A URL rejected because it does not point at a public internet host. */
export class BlockedUrlError extends Error {
  /** The URL that was rejected. */
  readonly url: string;

  constructor(url: string, reason: string) {
    super(`Refusing to fetch ${url}: ${reason}`);
    this.name = "BlockedUrlError";
    this.url = url;
  }
}

/** Schemes we are willing to fetch. Everything else (data:, file:, ...) is out. */
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

/** Parse an IPv4 dotted quad into its 32-bit value, or null if malformed. */
function parseIpv4(value: string): number | null {
  const parts = value.split(".");
  if (parts.length !== 4) {
    return null;
  }
  let result = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) {
      return null;
    }
    const octet = Number(part);
    if (octet > 255) {
      return null;
    }
    result = result * 256 + octet;
  }
  return result;
}

/** IPv4 ranges that must never be fetched, as [network, prefix length]. */
const BLOCKED_IPV4: ReadonlyArray<readonly [string, number]> = [
  ["0.0.0.0", 8], // "this network"
  ["10.0.0.0", 8], // RFC1918 private
  ["100.64.0.0", 10], // RFC6598 carrier-grade NAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local, includes cloud metadata at 169.254.169.254
  ["172.16.0.0", 12], // RFC1918 private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.0.2.0", 24], // TEST-NET-1
  ["192.168.0.0", 16], // RFC1918 private
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // TEST-NET-2
  ["203.0.113.0", 24], // TEST-NET-3
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved, includes 255.255.255.255
];

/** Whether an IPv4 address falls inside a blocked range. */
export function isBlockedIpv4(address: string): boolean {
  const value = parseIpv4(address);
  if (value === null) {
    return true; // unparseable is not provably public
  }
  for (const [network, prefix] of BLOCKED_IPV4) {
    const base = parseIpv4(network);
    if (base === null) {
      continue;
    }
    // Shifting by 32 is undefined in JS; a /0 would match everything anyway.
    const mask = prefix === 0 ? 0 : (-1 << (32 - prefix)) >>> 0;
    if ((value & mask) >>> 0 === (base & mask) >>> 0) {
      return true;
    }
  }
  return false;
}

/** Whether an IPv6 address is loopback, unspecified, or otherwise non-public. */
export function isBlockedIpv6(address: string): boolean {
  const normalized = address.toLowerCase().split("%")[0] ?? "";

  // IPv4-mapped (::ffff:127.0.0.1) and IPv4-compatible forms carry a v4
  // address that the v4 rules must judge, or the mapping becomes a bypass.
  const mapped = /^(?:::ffff:|::)(\d{1,3}(?:\.\d{1,3}){3})$/.exec(normalized);
  if (mapped?.[1] !== undefined) {
    return isBlockedIpv4(mapped[1]);
  }

  if (normalized === "::1" || normalized === "::") {
    return true;
  }
  // fc00::/7 unique-local, fe80::/10 link-local, ff00::/8 multicast.
  return /^(f[cd]|fe[89ab]|ff)/.test(normalized);
}

/** Whether a resolved IP address must not be fetched. */
export function isBlockedAddress(address: string): boolean {
  return address.includes(":")
    ? isBlockedIpv6(address)
    : isBlockedIpv4(address);
}

/** Hostnames that resolve locally regardless of DNS. */
function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return host === "localhost" || host.endsWith(".localhost");
}

/** Injectable DNS resolution so tests need no network. */
export interface SsrfDeps {
  /** Resolve a hostname to one or more IP addresses. */
  resolve?: (hostname: string) => Promise<string[]>;
}

async function defaultResolve(hostname: string): Promise<string[]> {
  const records = await lookup(hostname, { all: true, verbatim: true });
  return records.map((record) => record.address);
}

/**
 * Throw {@link BlockedUrlError} unless `url` points at a public host.
 *
 * Every address the hostname resolves to must be public: a name with both a
 * public and a private record is rejected, since which one the fetch uses is
 * not ours to choose.
 *
 * @param url The URL to validate.
 * @param deps Injectable DNS resolution for tests.
 */
export async function assertPublicUrl(
  url: string,
  deps: SsrfDeps = {},
): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new BlockedUrlError(url, "not a valid URL");
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    throw new BlockedUrlError(url, `unsupported scheme "${parsed.protocol}"`);
  }

  // Strip the brackets IPv6 authorities carry in URLs.
  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
  if (hostname === "") {
    throw new BlockedUrlError(url, "missing hostname");
  }
  if (isBlockedHostname(hostname)) {
    throw new BlockedUrlError(url, "hostname resolves to the local machine");
  }

  // A literal IP in the URL needs no DNS round trip.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.includes(":")) {
    if (isBlockedAddress(hostname)) {
      throw new BlockedUrlError(url, `address ${hostname} is not public`);
    }
    return;
  }

  const resolve = deps.resolve ?? defaultResolve;
  let addresses: string[];
  try {
    addresses = await resolve(hostname);
  } catch {
    throw new BlockedUrlError(url, `could not resolve ${hostname}`);
  }
  if (addresses.length === 0) {
    throw new BlockedUrlError(url, `${hostname} resolved to no addresses`);
  }
  for (const address of addresses) {
    if (isBlockedAddress(address)) {
      throw new BlockedUrlError(
        url,
        `${hostname} resolves to non-public address ${address}`,
      );
    }
  }
}
