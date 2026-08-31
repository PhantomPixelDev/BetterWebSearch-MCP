# Task 7 — Add TypeDoc API reference bridge (typedoc-plugin-markdown into Hugo)

**Date:** 2026-08-31
**Plan:** `.omo/plans/public-launch-github-npm-website.md` todo 7

## Summary

Added a TypeDoc → Hugo markdown bridge so the API reference renders inside the Hugo docs site. Raw TypeDoc HTML cannot be consumed by Hugo, so `typedoc-plugin-markdown` + `typedoc-plugin-frontmatter` + a custom `scripts/typedoc-frontmatter.mjs` plugin emit Hugo-compatible markdown into `site/content/docs/api/`, and `scripts/typedoc-postprocess.mjs` renames the root `index.md` → `_index.md` (so Hugo treats `docs/api/` as a section) and rewrites relative `.md` links to `.html`.

## Files created / changed

- `typedoc.json` — entryPoints `src/**/*.ts`, out `site/content/docs/api`, plugins `typedoc-plugin-markdown` + `typedoc-plugin-frontmatter` + `./scripts/typedoc-frontmatter.mjs`, `githubPages: false`, table formats, `frontmatterGlobals.draft: false`
- `scripts/typedoc-frontmatter.mjs` — custom TypeDoc plugin injecting `title` + `weight` front-matter per page
- `scripts/typedoc-postprocess.mjs` — renames root `index.md` → `_index.md`, ensures front-matter, rewrites `.md` → `.html` links
- `package.json` — devDeps `typedoc@^0.28.20`, `typedoc-plugin-markdown@^4.13.0`, `typedoc-plugin-frontmatter@^1.3.1`; scripts `docs:api`, `docs:build`, `docs:serve`
- `package-lock.json` — updated for new devDeps
- `site/content/docs/api/**/*.md` — generated API markdown (modules: extraction, providers, ranking, tools, utils)

## Verification results

### TypeDoc generation
```
npx typedoc --options typedoc.json  → exit 0
node scripts/typedoc-postprocess.mjs → renamed site/content/docs/api/index.md -> _index.md
```

### API output
```
ls site/content/docs/api/ → _index.md, index-1.md, providers.md, tools.md
  + extraction/ (11 files), providers/ (5), ranking/ (3), tools/ (5), utils/ (7)
```

### Hugo build (with API content)
```
hugo v0.161.1 windows/amd64
Pages            │ 57
Paginator pages  │  3
Static files     │  8
Aliases          │  2
Total in 1330 ms
EXIT=0
```

### Content verification
- `grep -rl "SearchProvider\|BrowserPool\|Cache" site/content/docs/api/` → 20 files match ✓
- `site/content/docs/api/_index.md` exists (Hugo section index) ✓
- No `*.html` files under `site/content/docs/api/` (markdown only) ✓

## Acceptance criteria

- [x] `ls typedoc.json` exists; `grep -q "typedoc-plugin-markdown" typedoc.json` passes
- [x] `npx typedoc --options typedoc.json` exits 0
- [x] `ls site/content/docs/api/` contains `_index.md` markdown
- [x] `hugo --source site --gc --minify` exits 0 (no errors)
- [x] `grep -rq "SearchProvider\|BrowserPool\|Cache" site/content/docs/api/` passes

## Guardrails respected

- `site/content/docs/api` is markdown only — no raw TypeDoc HTML committed
- `site/public` NOT committed (gitignored)
- Existing workflows NOT modified
