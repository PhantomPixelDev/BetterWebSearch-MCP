# Task 2 — Community Health Files

**Date:** 2026-08-31
**Plan:** public-launch-github-npm-website.md
**Todo:** 2. Add GitHub community health files — CONTRIBUTING, SECURITY, CODE_OF_CONDUCT

## Files created

```
CONTRIBUTING.md       4236 bytes
SECURITY.md           3981 bytes
CODE_OF_CONDUCT.md    5495 bytes
.github/FUNDING.yml      26 bytes
```

## Verification — file sizes (>800 bytes each)

```
Get-Item CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md, .github/FUNDING.yml | Select-Object Name, Length

Name              Length
----              ------
CONTRIBUTING.md      4236
SECURITY.md          3981
CODE_OF_CONDUCT.md   5495
FUNDING.yml            26
```

## Verification — grep checks

```
grep -c "Contributor Covenant" CODE_OF_CONDUCT.md    → 2 (pass)
grep -c "npm ci" CONTRIBUTING.md                      → 1 (pass)
grep -c "Security" SECURITY.md                        → 1 (pass)
grep -c "Security Advisories" SECURITY.md             → 1 (pass)
grep -c "ledbussiness1420@gmail.com" CODE_OF_CONDUCT.md → 1 (pass)
grep -c "0.1.x" SECURITY.md                           → 2 (pass)
grep -c "BRAVE_API_KEY" CONTRIBUTING.md               → 1 (pass)
```

## Content summary

### CONTRIBUTING.md
- Quick start: git clone → npm ci → npm run build → npm test
- Keyless-first note with env vars table (BRAVE_API_KEY, TAVILY_API_KEY, SERPAPI_KEY, cache/browser toggles)
- Project structure overview
- Branching: main, feat/*, fix/*, docs/*
- PR checklist: lint, test, build, tests, types, CHANGELOG, pack, no secrets
- Conventional Commits message format
- Links to SECURITY.md and CODE_OF_CONDUCT.md

### SECURITY.md
- Supported versions: 0.1.x
- Disclosure: GitHub Security Advisories (private)
- 90-day disclosure window
- Scope: HTTP fetch (src/extraction/fetch.ts), Playwright browser (src/extraction/browser.ts), API interception (src/extraction/apiIntercept.ts), cache poisoning (src/utils/cache.ts)
- Mitigations documented
- Out of scope: third-party dep vulns, env/filesystem access, stdio DoS

### CODE_OF_CONDUCT.md
- Contributor Covenant v2.1 — full verbatim text
- Enforcement contact: ledbussiness1420@gmail.com (from package.json:31)
- All 4 enforcement levels: Correction, Warning, Temporary Ban, Permanent Ban

### .github/FUNDING.yml
- github: [PhantomPixelDev]
