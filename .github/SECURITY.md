# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| 0.3.x | Yes |
| < 0.3.0 | No |

Only the latest release in the `0.3.x` line receives security patches. Once a new minor or major version ships, previous lines are no longer maintained.

## Reporting a vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Instead, use [GitHub Security Advisories](https://github.com/PhantomPixelDev/BetterWebSearch-MCP/security/advisories/new) to report privately. This ensures the issue can be triaged and fixed before public disclosure.

When reporting, include:

1. A clear description of the vulnerability and its potential impact.
2. Steps to reproduce (proof-of-concept code, request/response dumps, etc.).
3. The version you tested against.
4. Any mitigations you've identified.

### What to expect

- **Acknowledgement** within 72 hours.
- **Triage and initial assessment** within 7 days.
- **Target fix** within 30 days of confirmation, depending on severity.
- **Disclosure** coordinated with the reporter — we follow a **90-day disclosure window** from initial report. If a fix isn't ready within 90 days, we'll coordinate an interim disclosure timeline with you.

We'll credit reporters in the release notes unless anonymity is requested.

## Scope

This policy covers the `better-web-search-mcp` npm package and this GitHub repository. The primary attack surface includes:

### HTTP fetching (`src/extraction/fetch.ts`)

The server fetches user-supplied URLs via Node's built-in `fetch`. As of 0.3.0
every URL passes an SSRF guard before the request: non-HTTP schemes are refused,
hostnames are resolved, and private, loopback, link-local, CGNAT, multicast and
reserved addresses are rejected, including IPv4-mapped IPv6 forms. Redirects are
followed manually so each hop is re-checked, capped at 5 hops. Residual risks:

- Oversized or malformed responses that consume memory (mitigated by the 2MB
  body cap and the request timeout).
- HTML designed to exploit downstream parsers (Cheerio, JSDOM, Readability).
- A DNS record that changes between the guard's lookup and the socket connect
  (classic rebinding). The guard rejects names resolving to any non-public
  address, which closes the common cases but not a perfectly timed flip.

### Playwright browser (`src/extraction/browser.ts`)

The browser extraction tier launches a headless Chromium instance via Playwright. Risks include:

- **Code execution via crafted pages** — Chromium's renderer is a complex attack surface. Even with sandboxing, a malicious page could potentially exploit renderer bugs.
- **Resource exhaustion** — a malicious URL could serve infinite redirects, infinite JavaScript loops, or memory-heavy DOMs.
- **Cookie/session leakage** — the browser pool shares a persistent context. Ensure no sensitive cookies are set during extraction.

### API interception (`src/extraction/apiIntercept.ts`)

`page.on('response')` captures network responses to find structured data. A crafted page could serve misleading JSON payloads that poison the `api_patterns` cache.

### Cache poisoning (`src/utils/cache.ts`)

The SQLite cache (`data/cache.db`) stores domain profiles and API patterns. A compromised cache file could influence future extraction behavior.

### Prompt injection (`src/extraction/untrusted.ts`)

Retrieved page content is attacker-controlled and is returned to an LLM agent. A
page can contain text addressed to the agent rather than the reader. Extraction
results carry a `security` block marking content untrusted and flagging matched
injection patterns with offsets. This is a signal for the calling agent, not a
filter: content is never rewritten, and detection is heuristic.

### Mitigations already in place

- Browser pool has a configurable size limit (default 3).
- HTTP responses have size limits and timeouts.
- Cache rows expire automatically (15 min search, 1 hour page).
- `BETTER_WEB_SEARCH_DISABLE_BROWSER=true` disables the browser tier entirely.
- `BETTER_WEB_SEARCH_DISABLE_CACHE=true` falls back to in-memory storage, and
  `BETTER_WEB_SEARCH_CACHE_PATH` relocates the database (both honored as of 0.2.3;
  earlier versions parsed them but always opened `data/cache.db`).
- A cache database that cannot be opened — locked, corrupt, or unwritable —
  degrades to in-memory rather than aborting startup (0.2.2).

### Out of scope

- Vulnerabilities in third-party dependencies (report those upstream, but do mention them in your advisory so we can assess impact).
- Issues requiring the attacker to already have write access to the user's environment variables or filesystem.
- Denial-of-service against the MCP transport (stdio) — this is an inherently local protocol.

## For maintainers

### Patching process

1. Create a private fork via GitHub's security advisory interface.
2. Develop the fix in the private fork.
3. Release a patch version (`npm version patch`), which triggers `release.yml`.
4. Publish the advisory after the patch is live.

### Dependency updates

Run `npm audit` regularly. Dependabot alerts are monitored. Critical CVEs in `playwright`, `cheerio`, `jsdom`, or `better-sqlite3` should be patched within 7 days.
