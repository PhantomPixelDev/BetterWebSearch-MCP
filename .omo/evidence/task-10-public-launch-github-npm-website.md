# Task 10 — Public launch checklist & release validation

**Date:** 2026-08-31
**Status:** ✅ PASS — all verification green

## Verification Results

### 1. `.omo/` sanitized

```
> git ls-files -- .omo/
.omo/evidence/task-1-public-launch-github-npm-website.md
.omo/evidence/task-2-public-launch-github-npm-website.md
.omo/evidence/task-3-public-launch-github-npm-website.md
.omo/evidence/task-4-public-launch-github-npm-website.md
.omo/evidence/task-8-public-launch-github-npm-website.md
.omo/evidence/task-9-public-launch-github-npm-website.md
```

Only evidence files tracked. No `.omo/drafts/`, `.omo/plans/`.
`.gitignore` line 2: `.omo/`

### 2. Lint (tsc --noEmit)

```
> npm run lint
> better-web-search-mcp@0.1.0 lint
> tsc --noEmit
```

Zero errors. Clean exit.

### 3. Tests (vitest run)

```
> npm test
> better-web-search-mcp@0.1.0 test
> vitest run

 Test Files  25 passed (25)
      Tests  213 passed (213)
   Duration  10.17s
```

### 4. Build (tsc)

```
> npm run build
> better-web-search-mcp@0.1.0 build
> tsc
```

Clean. `dist/index.js` emitted.

### 5. Shebang check

```
> Get-Content dist/index.js -First 1
#!/usr/bin/env node
```

### 6. `npm pack --dry-run` — tarball contents

```
npm notice Tarball Contents
npm notice 147B .vscode/mcp.json
npm notice 1.1kB LICENSE
npm notice 10.1kB README.md
npm notice 2.8kB dist/extraction/alternative.d.ts
... (dist/ — all .js, .d.ts, .js.map, .d.ts.map)
npm notice 340B mcp.json
npm notice 2.9kB package.json
npm notice 739B scripts/check-native.mjs
npm notice 1.4kB scripts/smoke.mjs
npm notice 2.4kB scripts/test-mcp-tools.mjs
npm notice 2.0kB scripts/test-mcp.mjs
npm notice 748B scripts/typedoc-frontmatter.mjs
npm notice 2.7kB scripts/typedoc-postprocess.mjs
npm notice 1.3kB smithery.yaml

npm notice Tarball Details
npm notice name: better-web-search-mcp
npm notice version: 0.1.0
npm notice filename: better-web-search-mcp-0.1.0.tgz
npm notice package size: 122.4 kB
npm notice unpacked size: 533.4 kB
npm notice total files: 248
```

**No `.omo`, `src/`, `.github/`, `data/`, `site/` in tarball.** ✅

### 7. Hugo build

```
> hugo --source site --gc --minify

Start building sites …
hugo v0.161.1 windows/amd64

WARN  Module "blowfish" is not compatible with this Hugo version: 0.162.0/0.165.0 extended

                  │ EN
 Pages            │ 57
 Paginator pages  │  3
 Static files     │  8
 Aliases          │  2

Total in 1543 ms
```

57 pages built. `site/public/index.html` exists. ✅

### 8. Pages workflow present

`.github/workflows/pages.yml` confirmed:
- `permissions: pages: write`, `id-token: write`
- `peaceiris/actions-hugo@v3`
- `actions/upload-pages-artifact@v3`
- `actions/deploy-pages@v4`
- `concurrency: group: pages`

### 9. Release workflow — Trusted Publishing (OIDC)

`.github/workflows/release.yml` confirmed:
- `permissions: id-token: write` (line 10)
- `npm publish --provenance --access public` (line 31)
- No `NODE_AUTH_TOKEN` — OIDC only

### 10. Checklist file created

`docs/LAUNCH_CHECKLIST.md` — 10 checklist items + CNAME future note + post-launch actions.

## Summary

| Gate | Status |
|---|---|
| `.omo/` sanitized | ✅ |
| `npm run lint` | ✅ 0 errors |
| `npm test` | ✅ 213/213 pass |
| `npm run build` | ✅ dist/index.js emitted |
| `npm pack --dry-run` | ✅ correct contents, no leaks |
| `hugo --source site --gc --minify` | ✅ 57 pages |
| `pages.yml` workflow | ✅ |
| Trusted Publishing (OIDC) | ✅ no NPM_TOKEN |
| `.nvmrc` = 20 | ✅ |
| `docs/LAUNCH_CHECKLIST.md` | ✅ |

**Verdict:** Ready for public launch. All automated checks green.
