# Task 1 — Sanitize .omo leak

**Plan:** `.omo/plans/public-launch-github-npm-website.md` todo 1
**Date:** 2026-08-31
**Status:** PASS

## Goal

- `.gitignore` contains `^.omo/$` as first lines
- `git ls-files -- .omo` returns 0
- `npm pack --dry-run` excludes `.omo`

## Changes

1. **`.gitignore`** — added `.omo/` at the top (line 2, after the comment header) to ignore the entire `.omo/` directory. Removed the now-redundant `.omo/evidence/` and `.omo/run-continuation/` specific lines (covered by the parent `.omo/` rule). Preserved all other existing lines.

2. **Untracked `.omo/drafts` + `.omo/plans`** — ran `git rm -r --cached .omo/drafts .omo/plans` (index-only; files remain on disk).

## Command outputs

### `git ls-files -- .omo` (before)

```
.omo/drafts/better-web-search-mcp.md
.omo/plans/better-web-search-mcp.md
```

### `git rm -r --cached .omo/drafts .omo/plans`

```
rm '.omo/drafts/better-web-search-mcp.md'
rm '.omo/plans/better-web-search-mcp.md'
```

### `git ls-files -- .omo` (after) — empty (0 lines)

```
```

### `git status --short`

```
 M .gitignore
D  .omo/drafts/better-web-search-mcp.md
D  .omo/plans/better-web-search-mcp.md
```

Staged deletions (`D ` in index column), not untracked dirty worktree.

### `.gitignore` head

```
# Internal planning / evidence (not shipped, not tracked)
.omo/

# Dependencies
node_modules/
...
```

`Select-String -Path .gitignore -Pattern "^\.omo/$"` → `.gitignore:2:.omo/` — PASS.

### `npm pack --dry-run 2>&1 | grep "\.omo"` — empty (no `.omo` in tarball)

```
```

## Acceptance criteria

| Criterion | Result |
|---|---|
| `git ls-files -- .omo/` returns 0 lines | ✅ PASS |
| `grep -q "^\.omo/$" .gitignore` passes | ✅ PASS |
| `npm pack --dry-run 2>&1 \| grep -q "\.omo"` fails (no .omo in tarball) | ✅ PASS |
| `git status --short` shows staged `D .omo/...` not untracked dirty worktree | ✅ PASS |

## Notes

- Files were **not** deleted on disk — only untracked from the index.
- **History note:** pushed history still contains `.omo` from commit `dd733ad`. `git rm --cached` does **not** purge pushed history. A true purge requires `git filter-repo --path .omo --invert-paths` + `git push --force` with explicit user consent. **Not performed** — opt-in only, per plan guardrails.
- `package.json` untouched.
