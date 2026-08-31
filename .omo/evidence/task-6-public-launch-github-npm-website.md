# Task 6 Evidence: Author docs IA + migrate README

## Goal
Create 9 markdown pages (index + 8 docs) in `site/content/docs/` with correct front-matter, Hugo build green.

## Files created

| File | Weight | Lines | Description |
|---|---|---|---|
| `_index.md` | 1 | 44 | Docs landing with hero + tools table + links |
| `quickstart.md` | 10 | 83 | Zero-config npx + from-source quickstart |
| `installation.md` | 15 | 95 | Requirements, npx, global, source, native binding note |
| `tools.md` | 20 | 157 | 6-tool overview + full input schemas from src/tools/*.ts |
| `configuration.md` | 25 | 94 | Env vars table, key aliases from config.ts, cache/browser settings |
| `providers.md` | 30 | 119 | SearchProvider interface, aggregation, ranking pipeline |
| `extraction.md` | 35 | 136 | 3-tier pipeline, confidence scores, content fusion, self-learning cache |
| `architecture.md` | 40 | 109 | Mermaid diagram, components, data flow, design decisions |
| `changelog.md` | 90 | 52 | Full CHANGELOG.md content (v0.1.0) |
| `contributing.md` | 95 | 55 | Link to CONTRIBUTING.md, quick start, PR checklist |

## Verification results

### Hugo build
```
Start building sites …
hugo v0.161.1 windows/amd64

                  │ EN
──────────────────┼─────
 Pages            │  21
 Paginator pages  │   0
 Non-page files   │   0
 Static files     │   8
 Processed images │   0
 Aliases          │   1
 Cleaned          │   0

Total in 857 ms
```
Exit code: 0

### File count
```
ls site/content/docs/*.md → 10 files (_index + 9 pages, ≥8 required)
```

### Front-matter check
All 10 files have `title:` and `weight:` in front-matter. Weights: 1, 10, 15, 20, 25, 30, 35, 40, 90, 95 — all as specified.

### Content verification
- `grep web_search site/content/docs/` → 6 matches across 4 files ✓
- `grep BRAVE_API_KEY site/content/docs/configuration.md` → 4 matches ✓
- `wc -l site/content/docs/tools.md` → 157 lines (>80 required) ✓
- All code fences preserved verbatim from README ✓
- No LICENSE content duplicated ✓
- All source data sourced from README.md, .env.example, src/utils/config.ts, src/providers/*.ts, src/extraction/*.ts, CHANGELOG.md, CONTRIBUTING.md
