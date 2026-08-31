# Task 3 — Add GitHub issue/PR templates and config

## Summary

Created `.github/ISSUE_TEMPLATE/bug_report.md`, `.github/ISSUE_TEMPLATE/feature_request.md`, `.github/ISSUE_TEMPLATE/config.yml`, and `.github/PULL_REQUEST_TEMPLATE.md`.

## Files created

| File | Size | Frontmatter / Key content |
|------|------|--------------------------|
| `.github/ISSUE_TEMPLATE/bug_report.md` | 1342 B | `name: Bug Report`, `labels: bug`, repro steps, env checklist (Node version, OS, provider) |
| `.github/ISSUE_TEMPLATE/feature_request.md` | 774 B | `name: Feature Request`, `labels: enhancement`, problem/solution/alternatives sections |
| `.github/ISSUE_TEMPLATE/config.yml` | 235 B | `blank_issues_enabled: false`, Discussions contact link |
| `.github/PULL_REQUEST_TEMPLATE.md` | 720 B | 6-checkbox checklist: lint, test, build, CHANGELOG, pack, no secrets |

## Verification

### ls — all 4 files exist
```
FullName                                                                                     Length
--------                                                                                     ------
.\.github\ISSUE_TEMPLATE\bug_report.md                                                     1342
.\.github\ISSUE_TEMPLATE\feature_request.md                                                 774
.\.github\ISSUE_TEMPLATE\config.yml                                                         235
.\.github\PULL_REQUEST_TEMPLATE.md                                                          720
```

### grep — blank_issues_enabled in config.yml
```
.config.yml
  1: blank_issues_enabled: false
```

### grep — npm test in PULL_REQUEST_TEMPLATE.md
```
.PULL_REQUEST_TEMPLATE.md
  14: - [ ] `npm test` passes (`vitest run` — all 189+ tests green)
```

### grep — labels: bug in bug_report.md
```
.bug_report.md
  5: labels: bug
```

### grep — labels: enhancement in feature_request.md
```
.feature_request.md
  5: labels: enhancement
```

## Acceptance criteria met

- [x] `ls .github/ISSUE_TEMPLATE/bug_report.md .github/ISSUE_TEMPLATE/feature_request.md .github/ISSUE_TEMPLATE/config.yml .github/PULL_REQUEST_TEMPLATE.md` — all exist
- [x] `grep -q "blank_issues_enabled" .github/ISSUE_TEMPLATE/config.yml` — passes
- [x] `grep -q "npm test" .github/PULL_REQUEST_TEMPLATE.md` — passes
- [x] PR template has 6 checkboxes (≥5 required): lint, test, build, CHANGELOG, pack, no secrets
- [x] Markdown templates used (not YAML forms requiring beta)
- [x] Existing workflows `ci.yml` / `release.yml` not overwritten
