# Task 9 — README/badges/docs polish

**Date:** 2026-08-31
**Status:** ✅ PASS

## Changes Made

### 1. README.md — Docs badge added after CI badge
```markdown
[![Docs](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://phantompixeldev.github.io/BetterWebSearch-MCP/)
```
Placed after the CI badge (line 11) and before the License badge.

### 2. README.md — Docs section added before License
```markdown
## Docs

Full documentation, API reference, and configuration guides: **[phantompixeldev.github.io/BetterWebSearch-MCP](https://phantompixeldev.github.io/BetterWebSearch-MCP/)**
```

### 3. site/config.toml — Footer menu entries added
```toml
[[menus.footer]]
  name = "GitHub"
  url = "https://github.com/PhantomPixelDev/BetterWebSearch-MCP"
  pre = "github"
  weight = 10

[[menus.footer]]
  name = "npm"
  url = "https://www.npmjs.com/package/better-web-search-mcp"
  pre = "globe"
  weight = 20

[[menus.footer]]
  name = "Docs"
  url = "https://phantompixeldev.github.io/BetterWebSearch-MCP/"
  pre = "file-lines"
  weight = 30
```

### 4. package.json homepage — Kept as-is
`"homepage": "https://github.com/PhantomPixelDev/BetterWebSearch-MCP#readme"` — NOT changed per plan.

## Verification

### Hugo build
```
hugo --source site --gc --minify
Pages: 57 | Non-page files: 0 | Static files: 8 | Total in 1189 ms
```

### Sitemap + robots.txt
- `site/public/sitemap.xml` — EXISTS ✅
- `site/public/robots.txt` — EXISTS ✅
- 46 URLs in sitemap, 0 broken internal links ✅

### Viewport meta
- `<meta name=viewport content="width=device-width,initial-scale=1">` present in `index.html` ✅

### Footer links in rendered HTML
- GitHub link with github.svg icon ✅
- npm link with globe.svg icon ✅
- Docs link with file-lines.svg icon ✅

### Dark mode toggle
- Appearance switcher button present in header ✅

### Link check (lychee fallback)
- lychee not available; manual fallback:
  - 46 sitemap URLs checked — 0 broken ✅
  - All key HTML files exist: index.html, docs/quickstart/, docs/tools/, docs/configuration/, docs/api/ ✅
  - 0 broken internal links ✅

### TypeScript
```
npx tsc --noEmit
Exit code: 0 (zero errors)
```

## Acceptance Criteria Met
- [x] `grep -q "phantompixeldev.github.io/BetterWebSearch-MCP" README.md` — PASS
- [x] Docs badge exists after CI badge — PASS
- [x] `ls site/public/sitemap.xml site/public/robots.txt` — PASS
- [x] No 404s in site content — PASS (0 broken links)
- [x] `npx tsc --noEmit` — zero errors
- [x] Footer shows GitHub + npm + Docs links — PASS
- [x] No tracking JS added — PASS
- [x] README npx install blocks untouched — PASS
