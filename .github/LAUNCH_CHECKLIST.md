# Launch Checklist — better-web-search-mcp v0.1.0 (historical)

> **Completed.** This recorded the one-time pre-flight before the repository
> went public and `v0.1.0` shipped to npm. It is kept as a record of that
> launch and is not a checklist for current releases — see `CHANGELOG.md` for
> the release history and `package.json` `release:*` scripts for the current
> process.

Pre-flight validation before making the repository public and publishing to npm.

## Checklist

### 1. `.omo/` sanitized — no internal planning leaked

```bash
git ls-files -- .omo/
```

**Expected:** Only `.omo/evidence/task-*.md` files tracked (historical, committed intentionally).
No `.omo/drafts/`, `.omo/plans/`, or other internal files in the tree.

`.gitignore` contains `.omo/` at the top — all new `.omo/` content stays untracked.

> **History note:** `.omo/` content was pushed in earlier commits. A full purge requires
> `git filter-repo --path .omo --invert-paths` + `git push --force` with maintainer consent.
> This is **opt-in** and not done automatically.

### 2. Lint, tests, and build — all green

```bash
npm run lint && npm test && npm run build
```

| Check | Command | Expected |
|---|---|---|
| Type-check | `npm run lint` (`tsc --noEmit`) | Zero errors |
| Tests | `npm test` (`vitest run`) | 213+ tests pass, 0 fail |
| Build | `npm run build` (`tsc`) | `dist/index.js` emitted |
| Shebang | `head -1 dist/index.js` | `#!/usr/bin/env node` |

### 3. `npm pack --dry-run` — tarball contents correct

```bash
npm pack --dry-run --ignore-scripts
```

**Must contain:**
- `dist/` (compiled JS + declaration files)
- `README.md`
- `LICENSE` (MIT)
- `mcp.json`
- `smithery.yaml`
- `scripts/` (check-native.mjs, smoke.mjs, etc.)
- `.vscode/mcp.json`

**Must NOT contain:**
- `src/` (TypeScript source)
- `.omo/` (internal planning)
- `.github/` (workflows, templates)
- `data/` (SQLite cache)
- `site/` (Hugo output)
- `node_modules/`

### 4. Hugo docs site builds

```bash
npm run docs:build
```

**Expected:** `npm run docs:api` (TypeDoc → markdown) + `hugo --source site --gc --minify` exits 0.
Output: `site/public/index.html` exists, 57+ pages built.

**Quick smoke:**
```bash
hugo --source site --gc --minify && ls site/public/index.html
```

### 5. GitHub Pages deploy workflow present

```bash
cat .github/workflows/pages.yml
```

**Must have:**
- `permissions: pages: write` + `id-token: write`
- `actions/checkout@v4` with `submodules: recursive`
- `peaceiris/actions-hugo@v3` (extended)
- `actions/configure-pages@v5`
- `actions/upload-pages-artifact@v3` (path: `./site/public`)
- `actions/deploy-pages@v4`
- `concurrency: group: pages`

### 6. GitHub repo Settings (manual — cannot be scripted)

- [ ] **Visibility:** Public
- [ ] **Pages → Source:** GitHub Actions (not "Deploy from a branch")
- [ ] **Discussions:** Enabled
- [ ] **Branch protection on `main`:** Require status checks (CI) before merging
- [ ] **Actions → General:** Workflow permissions "Read and write"

### 7. npm provenance — Trusted Publishing (OIDC)

```bash
grep -q "id-token: write" .github/workflows/release.yml
grep -q "npm publish --provenance" .github/workflows/release.yml
```

**Key:** `release.yml` uses OIDC `id-token: write` — **no long-lived `NPM_TOKEN` secret.**
npmjs.org verifies the GitHub OIDC token at publish time.

> **Important:** npm provenance requires the GitHub repository to be **PUBLIC** so the
> OIDC attestation can be verified. Configure Trusted Publisher on npmjs.org:
> Access → Trusted Publishers → Add GitHub repo + workflow `release.yml`.

### 8. Git tag v0.1.1 ready — triggers release

```bash
git tag -l "v*"
```

`v0.1.0` tag already exists (initial release). To publish next version:

```bash
npm run version:patch   # bumps to 0.1.1, updates CHANGELOG, creates tag
git push --follow-tags  # triggers release.yml → npm publish --provenance
```

`release.yml` triggers on push of tags matching `v*.*.*`.

### 9. `.nvmrc` and `.editorconfig` present

```bash
cat .nvmrc          # should be "20"
cat .editorconfig   # should have indent_size=2, end_of_line=lf
```

### 10. Community health files present

- `CONTRIBUTING.md` — setup, PR process, checklist
- `SECURITY.md` — responsible disclosure policy
- `CODE_OF_CONDUCT.md` — Contributor Covenant v2.1
- `.github/ISSUE_TEMPLATE/bug_report.md` + `feature_request.md` + `config.yml`
- `.github/PULL_REQUEST_TEMPLATE.md`

## CNAME — future step (NOT shipped in v1)

If a custom domain is desired later:

1. Create `site/static/CNAME` with the domain (e.g. `docs.phantompixel.dev`).
2. Configure DNS A/AAAA records or CNAME to `phantompixeldev.github.io`.
3. Update `site/config.toml` → `baseURL` to the custom domain.
4. This is **not included in v0.1.0** — GitHub Pages URL is `phantompixeldev.github.io/BetterWebSearch-MCP/`.

## Post-launch actions

1. `git push` to make repo public
2. Settings → Pages → Source → GitHub Actions
3. First Pages build triggers automatically on push to `main`
4. Tag `v0.1.1` → `npm publish --provenance` via `release.yml`
5. Monitor: https://github.com/PhantomPixelDev/BetterWebSearch-MCP/actions
6. Docs live at: https://phantompixeldev.github.io/BetterWebSearch-MCP/

---

*Checklist verified: 2026-08-31 — all automated checks green (lint, test, build, pack, hugo).*
