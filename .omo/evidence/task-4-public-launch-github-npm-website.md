# Task 4 — Harden npm publish (evidence)

Plan: `.omo/plans/public-launch-github-npm-website.md` → Todo 4
Date: 2026-08-31
Status: COMPLETE

## Scope

- `.nvmrc` == `20`
- `.editorconfig` present (root=true, indent 2, LF)
- `release.yml` migrated to OIDC Trusted Publishing (no `NODE_AUTH_TOKEN`)
- `npm pack --dry-run` excludes `.omo`/`src`/`.github`/`data`, includes `dist`/`README`/`LICENSE`
- `npx tsc --noEmit` zero
- README Publishing section documents Trusted Publishing steps

## Files changed

| File | Change |
|---|---|
| `.nvmrc` | Created with `20` |
| `.editorconfig` | Created (root=true, utf-8, LF, space indent 2, final newline) |
| `.github/workflows/release.yml` | Removed `env: NODE_AUTH_TOKEN`, kept `npm publish --provenance --access public`, kept `permissions: id-token: write` + `contents: write`, added Trusted Publishing comment |
| `README.md` | Publishing section: added Trusted Publishing setup steps, removed `NPM_TOKEN` prerequisite |
| `.omo/evidence/task-4-public-launch-github-npm-website.md` | This file |

## Verification results

### 1. `.nvmrc`

```
$ cat .nvmrc
20
```

### 2. `.editorconfig`

```
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true
```

`grep indent_size .editorconfig` → `indent_size = 2` ✓

### 3. `release.yml` — Trusted Publishing migration

```
permissions:
  contents: write
  id-token: write
...
      - run: npm publish --provenance --access public
```

- `grep -q "id-token: write"` → PASS
- `grep -q "NODE_AUTH_TOKEN"` → FAIL (removed) ✓
- `npm publish --provenance --access public` retained ✓
- `contents: write` retained ✓
- Trusted Publishing comment added (provenance requires public repo) ✓

### 4. `npm pack --dry-run`

- `dist/index.js` in tarball → PASS
- `README.md` in tarball → PASS
- `LICENSE` in tarball → PASS
- `.omo` excluded → PASS
- `src/` excluded → PASS
- `.github` excluded → PASS
- `data/` excluded → PASS

Tarball: `better-web-search-mcp-0.1.0.tgz`, package size 120.6 kB, unpacked 528.9 kB, 246 files.

### 5. `npx tsc --noEmit`

Exit code 0 — zero type errors.

### 6. README Publishing section

Updated with Trusted Publishing setup steps (npmjs.org → Access Tokens → Trusted Publishers → add GitHub repo `PhantomPixelDev/BetterWebSearch-MCP` + workflow `release.yml`). Removed `NPM_TOKEN` prerequisite; noted provenance requires public repo.

## Guardrails respected

- No `npm publish` executed (dry-run only)
- `publishConfig` unchanged (`access: public`, registry npmjs.org)
- Package name unchanged (`better-web-search-mcp`)
- No force-push
